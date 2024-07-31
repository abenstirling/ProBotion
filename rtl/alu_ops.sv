`ifndef ALU_OPS_SV
`define ALU_OPS_SV

typedef enum bit [3:0] {
    ADD,
    SUB,
    XORMT,
    ANDMT,
    AND,
    OR,
    XOR,
    SHIFT,
    SSB,
    PASSB
} alu_ops;

`endif