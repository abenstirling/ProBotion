const ProBotionAssembler = require("./pbasm.js"); 


let asm = new ProBotionAssembler();

[loop, loop_end] = asm.giveJumpTable(2);

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
function performParity(mask, msg_lo, msg_hi) {

    with (asm) {
        [pr_lo, pr_hi] = give(2);

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

function doMessage(msg_lo, msg_hi) {
    with (asm) {
        [p8, p4, p2, p1, p0, mask] = give(6);

        // Perform Core Computation
        // Assuming msg_low/msg_hi is already loaded, so only parities must be done

        //p8
        performParity("11111110000", msg_lo, msg_hi);
        mov(p8, acc)

        //p4
        performParity("11110001110", msg_lo, msg_hi);
        mov(p4, acc)

        //p2
        performParity("11001101101", msg_lo, msg_hi);
        mov(p2, acc)

        //p1
        performParity("10101011011", msg_lo, msg_hi);
        mov(p1, acc)

        //p0
        performParity("11111111111", msg_lo, msg_hi);

        // Shift and append all computed parities.
        shl(1); or(p8);
        shl(1); or(p4);
        shl(1); or(p2);
        shl(1); or(p1);

        // Merge parities with XOR Mask (Mask = 0b1_1111 = 31)
        mov(p0, acc);
        mui(31);
        mov(mask, acc);
        mov(acc, p0);
        xorm(mask);
        mov(p0, acc);

        release(mask);

        // Bitstream assembly 

        [out_hi, out_lo] = give(2);

        /*
            Bitstream format:
            Output MSW = b11 b10 b9 b8 b7 b6 b5 p8
            LSW = b4 b3 b2 p4 b1 p2 p1 p0
         */

        // Assemble out_hi (MSW)
        mov(acc, msg_hi);
        shl(5);
        mov(out_hi, acc);
        mov(acc, msg_lo);
        shr(4);
        shl(1); or(out_hi);
        or(p8);
        mov(out_hi, acc);

        // Assembler out_low(LSW)
        mov(acc, msg_lo);
        shl(4);
        mov(out_lo, acc);
        ssb(4);
        shr(1);
        or(out_lo);
        mov(out_lo, acc);
        mov(acc, p4);
        shl(2); or(p2);
        shl(1); or(p1);
        shl(1); or(p0);
        or(out_lo);
        mov(out_lo, acc);

        release(p8, p4, p2, p1, p0);

        return [out_lo, out_hi];
    }
}

with (asm) {
    start();
    [msg_lo, msg_hi, loop_ctr, tmp] = give(4);
    n30 = li(asm, 30); 

    mui(0);
    mov(loop_ctr, acc);

    label(loop);
    
    mov(acc, loop_ctr);
    sub(n30);
    jz(loop_end);

    mov(acc, loop_ctr);
    mov(msg_lo, acc);
    ld(msg_lo);

    mui(1);
    add(loop_ctr);
    mov(msg_hi, acc);
    ld(msg_hi);

    [out_lo, out_hi] = doMessage(msg_lo, msg_hi);
    release(msg_lo, msg_hi);
    mov(acc, loop_ctr);
    shl(1);
    add(n30);
    mov(tmp, acc);
    mov(acc, out_lo);
    st(tmp);

    mui(1);
    mov(tmp, acc);
    mov(acc, loop_ctr);
    shl(1);
    add(tmp)
    add(n30);
    //add(n1);
    mov(tmp, acc);
    mov(acc, out_hi);
    st(tmp);

    mui(1);
    add(loop_ctr);
    mov(loop_ctr, acc);

    j(loop);
    label(loop_end)

    done();

    emitOut();
}