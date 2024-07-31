module dmem(
    input clk,
    input logic [7:0] dm_addr,
    input logic [7:0] dm_in,
    output logic [7:0] dm_out,
    input logic dm_we
);

    logic [7:0] store [256];

    assign dm_out = store[dm_addr];

    always_ff @(posedge clk) begin
        if(dm_we)
            store[dm_addr] <= dm_in;
    end

endmodule