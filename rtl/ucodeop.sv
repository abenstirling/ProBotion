`define ACC 15

interface ucodeop;
    
    // Register File
    logic [3:0] PortAReg;
    logic [3:0] PortBReg;
    logic PortAWriteEnable;

    // ALU
    logic [3:0] ALUOp;
    logic ALUUsePortBImm;
    logic ALUShiftDirection; // 1 == Right

    // Control Flow
    logic JumpOnZero;
    logic ExJump;

    // Transfer In
    logic InUseALU;
    logic InUseRF;
    logic InUseDMEM;
    logic InUseImm;

    // Transfer Out
    logic OutRFWrite;
    logic OutDMWrite;

    // Immediate
    logic [7:0] Immediate;

    // Signal
    logic SignalDone;

endinterface