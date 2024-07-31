let asm = new ProBotionAssembler();

[loop, loop_end] = asm.giveJumpTable(2);

// This is a macro operation that supports building 8 immediates
// Clobbers ACC. Auto-allocates 1 register.
function li(asm, imm) {
    with (asm) {
        [res_reg] = give(1);
        mui((imm & 0xC0) >>> 6);
        shl(6);
        mov(res_reg, acc);

        mui(imm & 0x3F);
        or(res_reg);
        mov(res_reg, acc);
    }

    return res_reg;
}

function countPatternOccurrences(asm, pattern, msg_byte) {
    with (asm) {
        [count] = give(1);
        mov(acc, 0); // Initialize count to 0

        // Loop through the bits in the message byte
        [bit] = give(1);
        mui(7); // Initialize a mask for checking each bit
        mov(bit, acc);

        label(bit_loop);
        shr(1);
        and(msg_byte); // Extract the current bit
        xor(pattern); // Compare the bit to the pattern

        ssb(0); // Check if the result is zero (pattern match)
        jnz(bit_not_match); // If not zero, pattern doesn't match this bit

        // Increment the count if the pattern matches
        add(1);
        mov(count, acc);

        label(bit_not_match);
        mov(acc, bit);
        jnz(bit_loop); // Continue looping for all bits in the byte

        return count;
    }
}

with (asm) {
    start();
    [msg_ptr, pattern_ptr, total_count, byte_count, final_count] = give(5);

    // Initialize message pointer and byte count
    mov(msg_ptr, 0);
    mov(byte_count, 0);

    // Load the 5-bit pattern from data mem[32]
    ld(pattern_ptr);
    [pattern] = give(1);
    mov(pattern, acc);

    // Initialize total and final counts
    mov(total_count, 0);
    mov(final_count, 0);

    label(loop);

    // Load the current byte from data mem[msg_ptr]
    ld(msg_ptr);
    [msg_byte] = give(1);
    mov(msg_byte, acc);

    // Count occurrences of the pattern in the current byte
    [count] = countPatternOccurrences(asm, pattern, msg_byte);

    // Add the count to the total count
    add(count);
    mov(total_count, acc);

    // Check if the count is non-zero, indicating a pattern match in the byte
    ssb(0);
    jnz(byte_match);

    // No match in this byte, increment byte count
    add(1);
    mov(byte_count, acc);

    label(byte_match);

    // Increment message pointer
    add(1);
    mov(msg_ptr, acc);

    // Check if we've processed all 32 bytes
    mui(32);
    ssb(0);
    jnz(loop_end);

    // Calculate the final count by multiplying byte count and total count
    mov(final_count, byte_count);
    mul(total_count);
    mov(final_count, acc);

    // Store the counts in data mem[33] and data mem[34]
    [result_byte] = give(1);
    mov(result_byte, final_count);
    st(result_byte);
    mov(result_byte, byte_count);
    st(result_byte);

    // Prepare for the next search by resetting counts
    mov(byte_count, 0);
    mov(total_count, 0);
    mov(final_count, 0);

    // Increment pattern pointer for next search
    add(1);
    mov(pattern_ptr, acc);

    // Check if we've searched for all possible patterns
    mui(32);
    ssb(0);
    jnz(loop);

    label(loop_end);

    done();
}