`default_nettype none
`include "alu_ops.sv"

module alu(
    input clk,
    input logic [3:0] alu_op,
    input logic [7:0] alu_port_A,
    input logic [7:0] alu_port_B,
    input logic alu_shift_dir,
    output logic [7:0] alu_out,
    output logic alu_eq0
);

logic [7:0] ANDed;
logic [7:0] inv_mask;

assign ANDed = alu_port_A & alu_port_B;
assign inv_mask = ~alu_port_B;

always_comb begin
    case(alu_op)
        ADD:
            alu_out = alu_port_A + alu_port_B;
        SUB: 
            alu_out = alu_port_A - alu_port_B;
        XORMT:
            alu_out = {7'b0, ^ ANDed};
        ANDMT:
            alu_out = {7'b0, & (ANDed | inv_mask)};
        AND:
            alu_out = ANDed;
        OR: 
            alu_out = alu_port_A | alu_port_B;
        XOR: 
            alu_out = alu_port_A ^ alu_port_B;
        SHIFT: begin
            if(alu_shift_dir) // 1 == SHR
                alu_out = alu_port_A >> alu_port_B[2:0];
            else
                alu_out = alu_port_A << alu_port_B[2:0];
        end
        SSB:
            alu_out = {7'b0, (alu_port_A & (8'b1 << alu_port_B[2:0])) == 1};
        PASSB:
            alu_out = alu_port_B;
        default:
            alu_out = 0;
    endcase

    alu_eq0 = alu_port_A == 0;
end

endmodule