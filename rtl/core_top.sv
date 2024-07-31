`default_nettype none

// jz(0); // Forced to execute onStart.
`define BOOT_JMPZERO 9'b110_0_00000

module core_top(
    input clk,
    input start,
    output logic done
);

    enum bit[2:0] {FETCH, DECODE, EXECUTE, WRITEBACK} stage;

    logic [7:0] dm_addr;
    logic [7:0] dm_in;
    logic [7:0] dm_out;
    logic dm_we;
    
    dmem dm1(.*);

    logic [9:0] im_addr;
    logic [8:0] im_out;

    imem im1(.*);
    
    logic pc_reset;
    logic pc_advance;
    logic pc_set;
    logic [9:0] pc_new;
    logic [9:0] pc;

    pc_ctr pc1(.*);

    logic [3:0] alu_op;
    logic [7:0] alu_port_A;
    logic [7:0] alu_port_B;
    logic [7:0] alu_out;
    logic alu_shift_dir;
    logic alu_eq0;

    alu alu1(.*);

    logic dec_do;
    logic[8:0] instr;
    ucodeop ucode();

    decode dec1(.*);

    logic [3:0] rf_port_A;
    logic [7:0] rf_port_A_in;
    logic [7:0] rf_port_A_out;
    logic rf_port_A_we;

    logic [3:0] rf_port_B;
    logic [7:0] rf_port_B_out;

    rf rf1(.*);

    logic onStart;
    logic [7:0] transfer;
    logic jmp_cond;
    logic [7:0] alu_store;

    
    always_comb begin
        // Control Flow
        jmp_cond  = ucode.ExJump && ((ucode.JumpOnZero ^ alu_eq0) || onStart);
        pc_new = {im_out, 1'b0};            

        // Register File
        rf_port_A = ucode.PortAReg;
        rf_port_B = ucode.PortBReg;

        // Data Memory
        dm_addr = rf_port_A_out;

        // ALU
        alu_op = ucode.ALUOp;
        alu_port_A = rf_port_A_out;
        alu_port_B = ucode.ALUUsePortBImm ? ucode.Immediate : rf_port_B_out;
        alu_shift_dir = ucode.ALUShiftDirection;

        // Transfer Bus
        if(ucode.InUseALU)
            transfer = alu_store;
        else if(ucode.InUseRF)
            transfer = rf_port_A_out;
        else if(ucode.InUseDMEM)
            transfer = dm_out;
        else if(ucode.InUseImm)
            transfer = ucode.Immediate;
        else 
            transfer = 8'b0;

        dm_in = 0;
        rf_port_A_in = 0;

        if(ucode.OutDMWrite)
            dm_in = transfer;
        else if(ucode.OutRFWrite)
            rf_port_A_in = transfer;

    end

    always_ff @(posedge clk) begin
        if(start) begin
            stage <= FETCH;
            onStart <= 1;
            pc_reset <= 0;
            pc_advance <= 0;
            pc_set <= 0;
            done <= 0;
            
        end else begin
            case(stage)
                FETCH: begin
                    dm_we <= 0;
                    rf_port_A_we <= 0;

                    if(onStart) begin
                        instr <= `BOOT_JMPZERO;
                    end else
                        instr <= im_out;
                    
                    im_addr <= pc;
                    dec_do <= 1;
                    stage <= DECODE;
                end

                DECODE: begin
                    dec_do <= 0;
                    stage <= EXECUTE;
                end

                EXECUTE: begin
                    if(ucode.ExJump)
                        im_addr <= {2'b00, ucode.Immediate};
                    
                    if(jmp_cond)
                        pc_set <= 1;
                    else
                        pc_advance <= 1;

                    alu_store <= alu_out;
                    stage <= WRITEBACK;
                end

                WRITEBACK: begin
                    onStart <= 0;
                    pc_advance <= 0;
                    pc_set <= 0;

                    if(ucode.OutDMWrite)
                        dm_we <= 1;
                    if(ucode.OutRFWrite)
                        rf_port_A_we <= 1;
                    
                    if(ucode.SignalDone)
                        done <= 1;
                    
                    stage <= FETCH;
                end
                default:;

            endcase
        end
    end

endmodule