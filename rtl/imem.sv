module imem(
    input clk,
    input logic [9:0] im_addr,
    output logic [8:0] im_out
);

    logic [8:0] store [1024];
    assign im_out = store[im_addr];

    initial begin
        `ifdef LOAD_P1
            $readmemb("p1.mach.txt", store);
        `elsif LOAD_P2
            $readmemb("p2.mach.txt", store);
        `elsif LOAD_P3
            $readmemb("p3.mach.txt", store);
        `endif
    end

endmodule