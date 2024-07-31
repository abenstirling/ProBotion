module rf(
    input clk,
    input logic [3:0] rf_port_A,
    input logic [7:0] rf_port_A_in,
    input logic rf_port_A_we,
    output logic [7:0] rf_port_A_out,

    input logic [3:0] rf_port_B,
    output logic [7:0] rf_port_B_out
);

    logic [7:0] store [16];

    assign rf_port_A_out = store[rf_port_A];
    assign rf_port_B_out = store[rf_port_B];

    always_ff @(posedge clk) begin
        if(rf_port_A_we)
            store[rf_port_A] <= rf_port_A_in;
    end

endmodule