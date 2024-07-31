`default_nettype none

module pc_ctr(
    input clk,
    input pc_reset,
    input pc_advance,
    input pc_set,
    input [9:0] pc_new,
    output logic [9:0] pc
);

always_ff @(posedge clk) begin
    if(pc_reset)
        pc <= 10'b0;
    else if(pc_set)
        pc <= pc_new;
    else if(pc_advance)
        pc <= pc + 1;
end

endmodule