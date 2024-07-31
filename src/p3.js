const ProBotionAssembler = require("./pbasm.js"); 
let asm = new ProBotionAssembler();


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

with (asm){
    [loop, loop_end, cont_loop, cont_loop_end] = asm.giveJumpTable(4);
    start();

// Initialize commonly used constants
let one = li(asm, 1);
let four = li(asm, 4);
let thirtyTwo = li(asm, 32);
let twoFiftyOne = li(asm, 251);

// Initialize counter registers
let byteCounter = li(asm, 0);  // Counter for individual bytes
let totalCounter = li(asm, 0); // Counter for the entire continuous string
let contCounter = li(asm, 0);  // Counter for continuous string occurrence

// Initialize a temporary register
let tmp = asm.give(1);

// Initialize data mem[33], mem[34], and mem[35] to zero
let zero = li(asm, 0);
mui(33);
mov(tmp, acc);
st(tmp, zero);
mui(34);
mov(tmp, acc);
st(tmp, zero);
mui(35);
mov(tmp, acc);
st(tmp, zero);

// Main loop to go through each byte in data_mem[0:31]
label(loop);
    // Load current byte into ACC
    mov(acc, byteCounter);
    mov(tmp, acc)
    ld(tmp);

    // Sub-loop to check for pattern within each byte at 4 positions
    let shiftCounter = li(asm, 0);
    [shift_loop, shift_loop_end] = asm.giveJumpTable(2);
    label(shift_loop);

        // Your code to check for pattern and update mem[33] and mem[34]

        // Increment shiftCounter and loop
        add(shiftCounter, one);
        sub(four);
        jnz(shift_loop_end);

    label(shift_loop_end);

    // Increment byteCounter and check loop termination
    add(byteCounter, one);
    sub(thirtyTwo);
    jnz(loop_end);

label(loop_end);

// Loop to check for the pattern within the continuous 256-bit string
label(cont_loop);

    // Your code to check for pattern and update mem[35]

    // Increment contCounter and check loop termination
    add(contCounter, one);
    sub(twoFiftyOne);
    jnz(cont_loop_end);

label(cont_loop_end);

// Finalize and store the results
mui(33);
mov(tmp, acc);
st(tmp, byteCounter);
mui(34);
mov(tmp, acc);
st(tmp, totalCounter);
mui(35);
mov(tmp, acc);
st(tmp, contCounter);

done();

emitOut();
}