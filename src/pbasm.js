module.exports = class ProBotionAssembler {

    extUnsignedImm(imm, width) {
        if(imm < 0)
            throw "Immediate cannot be negative";
        try {        
        let str = imm.toString(2); 

        return ("0").repeat(width - str.length) + str;
        } catch(e) {
            throw "The immediate was too wide" + imm.toString(2);
        }
    }

    extSignedImm(imm, width) {

        let str = (imm >>> 0).toString(2); 

        if(str.length > width)
            return str.substring(32-width);

        return ("0").repeat(width - str.length) + str;
    }

    emitA(opcode, reg) {
        let str = opcode + reg;
        if(str.length != 9) throw "Malformed instruction";
        this.codeArray.push(str);
        this.emitAddress++;
    }
    
    emitR(opcode, imm) {
        let str = opcode + imm;
        if(str.length != 9) throw "Malformed instruction";
        this.codeArray.push(str);
        this.emitAddress++;
    }
    
    emitS(opcode, flag, imm) {
        let str = opcode + flag + imm;
        if(str.length != 9) throw "Malformed instruction";
        this.codeArray.push(str);
        this.emitAddress++;
    }

    nop() {
        this.emitS("11110", "0", "000");
    }

    done() {
        this.emitS("11110", "0", "111");
    }

    mui(imm) {
        this.emitR("100", this.extUnsignedImm(imm, 6));
    }
    
    msi(imm) {
        this.emitR("101", this.extSignedImm(imm, 6));
    }
    
    ssb(bit) {        
        this.emitS("11100", "0", this.extUnsignedImm(bit, 3));
    }
    
    jz(lab) {
        this.emitR("110", "1" + this.extUnsignedImm(lab, 5));
    }

    
    jnz(lab) {
        this.emitR("110", "0" + this.extUnsignedImm(lab, 5));
    }

    j(lab) {
        this.jz(lab);
        this.jnz(lab);
    }

    add(reg) {
        this.emitA("00000", this.extUnsignedImm(reg, 4));
    }

    sub(reg) {
        this.emitA("00001", this.extUnsignedImm(reg, 4));
    }

    xorm(reg) {
        this.emitA("00010", this.extUnsignedImm(reg, 4));
    }

    andm(reg) {
        this.emitA("00011", this.extUnsignedImm(reg, 4));
    }

    xor(reg) {
        this.emitA("00100", this.extUnsignedImm(reg, 4));
    }

    and(reg) {
        this.emitA("00101", this.extUnsignedImm(reg, 4));
    }

    or(reg) {
        this.emitA("00110", this.extUnsignedImm(reg, 4));
    }

    shl(dist) {
        this.emitS("01010", "0", this.extUnsignedImm(dist, 3));
    }

    shr(dist) {
        this.emitS("01010", "1", this.extUnsignedImm(dist, 3));
    }

    slr(reg) {
        this.emitA("01011", this.extUnsignedImm(reg, 4));
    }
    
    ld(reg) {
        this.emitA("01100", this.extUnsignedImm(reg, 4));
    }
    
    ld(reg) {
        this.emitA("01100", this.extUnsignedImm(reg, 4));
    }
    
    st(reg) {
        this.emitA("01101", this.extUnsignedImm(reg, 4));
    }
    
    mov(dest, src) {
        if(src == 15)
            this.emitA("01110", this.extUnsignedImm(dest, 4));
        else if(dest == 15)
            this.emitA("01111", this.extUnsignedImm(src, 4));
        else
            throw "MOV must have ACC as either source or destination.";

    }

    label(id) {
        if(this.emitAddress % 2 != 0)
            this.nop();
        
        this.jumpTable[id] = this.emitAddress >> 1;
    }

    start() {
        this.label(0);
    }

    giveJumpTable(n) {
        this.jumpTable = Array(n + 1).fill(0);
        
        this.emitAddress += n + 1;
        
        let ret = [];
        for(let i = 1; i < n + 1; i++)
        ret.push(i);
        
        return ret;
    }
    
    constructor() {
        this.jumpTable = [];
        this.codeArray = [];
        this.emitAddress = 0;
        this.allocations = Array(15).fill(false);
        this.acc = 15;
        this.ACC = 15;
    }

    giveOne() {
        for(let i = 0; i < 15; i++) {
            if(!this.allocations[i]){
                this.allocations[i] = true;
                return i;
            }
        }

        throw "Register allocations exhausted";
    }

    give(n) {
        let rets = [];
        for(let i = 0; i < n; i++){
            let reg = this.giveOne();
           // if(reg == 7) console.trace();
            rets.push(reg);
        }

        //console.trace(rets);
        
        return rets;
    }

    releaseOne(reg) {
        if(!this.allocations[reg]) {
            //console.log(reg, this.allocations);
            throw "Register allocation double-free occurred.";
            
        }
        
        this.allocations[reg] = false;
    }

    release(...regs) {
        for(const reg of regs)
            this.releaseOne(reg);
    }

    emit() {
        let str = "";

        for(let el of this.jumpTable) {
            str += this.extUnsignedImm(el, 9) + "\n";
        }

        for(let instr of this.codeArray) {
            str += instr + "\n";
        }
        
        return str;
    }

    emitOut() {
        let final = this.emit();
        console.log(final);
        return final;
    }
}