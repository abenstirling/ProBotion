
/*
function computeErrorPosition(asm, conflicts) {
    with(asm) {
        [sum] = give(1);
        p2t = li(par2);
        p4t = li(par4);
        p8t = li(par8);
        pDone = li(par_done);
        
        mui(0);
        mov(sum, acc);

        // P1
        mov(acc, conflicts);
        ssb(1);
        jz(p2t);

        mui(1);
        add(sum);
        mov(sum, acc);

        // P2
        label(par2);

        mov(acc, conflicts);
        ssb(2);
        jz(p4t);

        mui(2);
        add(sum);
        mov(sum, acc);

        // P4
        label(par4);

        mov(acc, conflicts);
        ssb(3);
        jz(p8t);

        mui(4);
        add(sum);
        mov(sum, acc);

        // P8
        label(par8);

        mov(acc, conflicts);
        ssb(4);
        jz(pDone);

        mui(8);
        add(sum);
        mov(sum, acc);

        label(par_done);

        release(p2t, p4t, p8t, pDone)
        return sum;

    }
}
*/