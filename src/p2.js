const ProBotionAssembler = require("./pbasm.js"); 

let asm = new ProBotionAssembler();

 [loop, loop_end, high_mask, end_mask, no_error, one_error, writeout] = asm.giveJumpTable(7);

// This is a macro operation that supports building 8 immediates
// Clobbers ACC. Auto-allocates 1 register.
function li(asm, imm) {
    with (asm) {
        let [res_reg] = give(1);
        mui((imm & 0xE0) >>> 5);
        shl(5);
        mov(res_reg, acc);

        mui(imm & 0x1F);
        or(res_reg);
        mov(res_reg, acc);

        return res_reg;
    }
}

// Parity computation macro
// Clobbers ACC. Leaves result in ACC.
function performParity(asm, mask, msg_lo, msg_hi) {

    with (asm) {
        let [pr_lo, pr_hi] = give(2);

        pm_lo = parseInt(mask.substring(0, 8), 2);
        pm_hi = parseInt(mask.substring(8), 2)

        // Load low mask
        mask_lo = li(asm, pm_lo);
        mov(acc, msg_lo);

        // Perform low parity
        xorm(mask_lo);
        mov(pr_lo, acc);

        // Load high mask
        mask_hi = li(asm, pm_hi);
        mov(acc, msg_hi);

        // Perform high parity
        xorm(mask_hi);
        mov(pr_hi, acc);

        // Load combining mask needed to combine parities (0b11)
        mui(3);
        mov(mask_lo, acc);

        //Combine low and high parity into one bitfield
        mov(acc, pr_hi);
        shl(1);
        or(pr_lo);

        // Perform combination of parities
        xorm(mask_lo);

        release(pr_lo, pr_hi, mask_lo, mask_hi);
    }
}

function doMessage(asm, msg_lo, msg_hi) {
    with (asm) {
        let [parities, mask] = give(2);

        mui(31);
        mov(mask, acc);

        // Perform Core Computation
        // Assuming msg_low/msg_hi is already loaded, so only parities must be done

        //p8
        performParity(asm, "11111110000", msg_lo, msg_hi);
        shl(4);
        mov(parities, acc);
        
        //p4
        performParity(asm, "11110001110", msg_lo, msg_hi);
        shl(3);
        or(parities);
        mov(parities, acc);

        //p2
        performParity(asm, "11001101101", msg_lo, msg_hi);
        shl(2);
        or(parities);
        mov(parities, acc);
        
        //p1
        performParity(asm, "10101011011", msg_lo, msg_hi);
        shl(1);
        or(parities);
        mov(parities, acc);

        //p0
        performParity(asm, "11111111111", msg_lo, msg_hi);
        or(parities);
        xorm(mask);
        or(parities);
        mov(parities, acc);
        release(mask);

        return [parities];
    }
}

/* Reproduce the original bitstream:
input MSW = b11 b10 b9 b8 b7 b6 b5 p8
LSW = b4 b3 b2 p4 b1 p2 p1 p0

output MSW = 0 0 0 0 0 b11 b10 b09
 LSW = b8 b7 b6 b5 b4 b3 b2 b1
*/
function reassembleMessage(asm, msg_lo, msg_hi) {
    with(asm) {
        let [orig_lo, orig_hi] = give(2);

        // MSW
        mov(acc, msg_hi);
        shr(5);
        mov(orig_hi, acc);

        // LSW
        mov(acc, msg_lo); // Prepare b1
        ssb(3);
        shr(3);
        mov(orig_lo, acc);

        mov(acc, msg_lo);
        shr(5);
        shl(1);
        or(orig_lo);
        mov(orig_lo, acc);

        mov(acc, msg_hi);
        shr(1);
        shl(4);
        or(orig_lo);
        mov(orig_lo, acc);

        return [orig_lo, orig_hi];
    }
}

// Produces bitfield 0 0 0 p8 p4 p2 p1 p0
function extractExistingParities(asm, msg_lo, msg_hi) {
    with(asm) {
        // p4
        let [parities] = give(1);
        mov(acc, msg_lo);
        ssb(4);
        shr(1);
        mov(parities, acc);
        
        // p2, p1, p0
        mov(acc, msg_lo);
        shl(5);
        shr(5);
        or(parities)
        mov(parities, acc);

        // p8
        mov(acc, msg_hi);
        shl(7);
        shr(3);
        or(parities);
        mov(parities, acc);

        return [parities];
    }
}


// Clobbers ACC, position
function maskFromPosition(asm, position) {
    with(asm) {
        let [tmp, mask_lo, mask_hi] = give(3);
        mui(8);
        mov(tmp, acc);
        mov(acc, position);
        sub(tmp);
        ssb(7); // Check if position - 8 > 0 (sign bit = 0)
        jz(high_mask); // the enabled bit will be in the high component

        // 1-bit in low mask
        mui(1);
        slr(position);
        mov(mask_lo, acc);
        mui(0);
        mov(mask_hi, acc);
        jnz(end_mask);

        
        // 1-bit in high mask
        label(high_mask);
        mui(1);
        mov(position, acc);
        slr(position);
        mov(mask_hi, acc);
        mui(0);
        mov(mask_lo, acc);

        label(end_mask);

        release(tmp);
        return [mask_lo, mask_hi];
    }
}

with (asm) {
    start();
    [msg_lo, msg_hi, loop_ctr, err_ctr, tmp] = give(5);

    mui(0);
    mov(loop_ctr, acc); 

    label(loop);
    n1 = li(asm, 1);
    n30 = li(asm, 30);

    mov(acc, loop_ctr);
    sub(n30);
    jz(loop_end);

    mov(acc, loop_ctr);
    shl(1);
    add(n30);
    mov(msg_lo, acc);
    ld(msg_lo);
    
    mov(acc, loop_ctr);
    shl(1);
    add(n30);
    add(n1);
    mov(msg_hi, acc);
    ld(msg_hi);

    mui(0);
    mov(err_ctr, acc);

    release(n1, n30);

    [orig_lo, orig_hi] = reassembleMessage(asm, msg_lo, msg_hi);
    
    [decl_parities] = extractExistingParities(asm, msg_lo, msg_hi);
    [comp_parities] = doMessage(asm, orig_lo, orig_hi);
    release(orig_lo, orig_hi);
    
        /* Implementing this from Lab:
          assign error_pointer = {parity[8]^s_parity[8],parity[4]^s_parity[4],parity[2]^s_parity[2],
                              parity[1]^s_parity[1]};
      
        always_comb begin
        flag = 'b0;                    // no errors
        if(error_pointer) begin
          if (s_parity[0] == parity[0]) 
            flag = 'b10000;            // two errors
          else
            flag = 'b01000;            // one error (other than parity[0])
        end
        else if(s_parity[0] != parity[0])   
          flag = 'b01000;              // one error (parity[0])
        */
    
    mov(acc, comp_parities);
    xor(decl_parities); // Parity differences
    release(decl_parities, comp_parities);

    let [conflicts, position] = give(2);
    mov(conflicts, acc);
    shr(1);
    mov(position, acc); // 0 0 0 0 p8 p4 p2 p1
    
    jz(writeout); // No errors

    // One or two errors

    mov(acc, conflicts);
    ssb(0);
    jnz(one_error) // one_error - inverse of s_parity[0] == parity[0]
    mui(2) // 2 Errors
    mov(err_ctr, acc);
    jnz(writeout); // jump to writeout
    
    // One fixable error (data or parity)
    label(one_error);

    mui(1);
    mov(err_ctr, acc);

    [mask_lo, mask_hi] = maskFromPosition(asm, position);
    // Apply repair
    mov(acc, msg_lo);
    xor(mask_lo);
    mov(msg_lo, acc);

    mov(acc, msg_hi);
    xor(mask_hi);
    mov(msg_hi, acc);

    release(mask_lo, mask_hi);

    jnz(writeout); // jump to writeouts

    // No Errors (except possibly on p0)
    label(no_error);

    // One error on p0
    mov(acc, conflicts);
    ssb(0);
    jz(writeout); // inverse of s_parity[0] != parity[0]
    mui(1);
    mov(err_ctr, acc);
    
    label(writeout);

    [final_lo, final_hi] = reassembleMessage(asm, msg_lo, msg_hi);

    // Low part (unmodified) - tmp stores target address
    mov(acc, loop_ctr);
    shl(1);
    mov(tmp, acc);
    mov(acc, final_lo);
    st(tmp)
    

    // High part
    //Generate address
    mov(acc, loop_ctr);
    shl(1);
    add(1);
    mov(tmp, acc);

    //Generate bitfield
    mov(acc, err_ctr);
    shl(6);
    or(final_hi);
    st(tmp);

    release();
    
    // Increment loop counter
    mui(1);
    add(loop_ctr);
    mov(loop_ctr, acc);
    
    j(loop);
    
    label(loop_end);
    release(final_lo);
    release(final_hi);
    release(err_ctr);
    release(tmp);
    release(loop_ctr);
    //release(final_lo, final_hi, err_ctr, tmp, loop_ctr);
    
    done();


    emitOut();
}