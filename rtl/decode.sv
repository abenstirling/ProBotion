`define ACC 15

module decode(
    input clk, 
    input logic dec_do, 
    input logic[8:0] instr, 
    ucodeop ucode);

    logic [2:0] op_base;
    logic op_mid;
    logic [1:0] op_sub;

    assign op_base = instr[8:6];
    assign op_mid = instr[5];
    assign op_sub = instr[5:4];

    logic [3:0] Areg;
    logic [5:0] Rimm;
    logic [2:0] Simm;
    logic  Sflag;

    assign Areg = instr[3:0];
    assign Rimm = instr[5:0];
    assign Simm = instr[2:0];
    assign Sflag = instr[3];

    always_ff @(posedge clk) begin
        if(dec_do) begin
            ucode.PortAReg <= 0;
            ucode.PortBReg <= 0;
            ucode.PortAWriteEnable <= 0;
            ucode.ALUOp <= 0;
            ucode.ALUUsePortBImm <= 0;
            ucode.ALUShiftDirection <= 0;
            ucode.JumpOnZero <= 0;
            ucode.ExJump <= 0;
            ucode.InUseALU <= 0;
            ucode.InUseRF <= 0;
            ucode.InUseDMEM <= 0;
            ucode.InUseImm <= 0;
            ucode.OutRFWrite <= 0;
            ucode.OutDMWrite <= 0;
            ucode.Immediate <= 0;
            ucode.SignalDone <= 0;

            case (op_base)
                3'b111: begin
                    if(op_mid) begin // NOP / DONE depending on S-immediate
                        if(Simm == 3'b111)
                            ucode.SignalDone <= 1;
                        // Otherwise NOP

                    end else begin // SSB
                        ucode.ALUOp <= SSB;
                        ucode.ALUUsePortBImm <= 1;
                        
                        ucode.Immediate <= {5'b0, Simm};
                        
                        ucode.PortAReg <= `ACC;
                        ucode.PortAWriteEnable <= 1;
                        
                        ucode.InUseALU <= 1;
                        ucode.OutRFWrite <= 1;
                    end
                end

                3'b100: begin // MUI
                    ucode.Immediate <= {2'b0, Rimm};

                    ucode.PortAReg <= `ACC;
                    ucode.PortAWriteEnable <= 1;

                    ucode.InUseImm <= 1;
                    ucode.OutRFWrite <= 1;

                end

                3'b101: begin // MSI
                    ucode.Immediate <= {Rimm[5], Rimm[5], Rimm};

                    ucode.PortAReg <= `ACC;
                    ucode.PortAWriteEnable <= 1;

                    ucode.InUseImm <= 1;
                    ucode.OutRFWrite <= 1;
                end

                3'b110: begin // JZ/JNZ
                    ucode.ExJump <= 1;
                    ucode.PortAReg <= `ACC;
                    ucode.JumpOnZero <= !Rimm[5]; 

                    ucode.Immediate <= {3'b000, Rimm[4:0]};
                end

                3'b000: begin // ADD / SUB / XORM / ANDM
                    case(op_sub)
                        2'b00: begin // ADD
                            ucode.ALUOp <= ADD;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b01: begin // SUB
                            ucode.ALUOp <= SUB;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b10: begin // XORM
                            ucode.ALUOp <= XORMT;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b11: begin // ANDM
                            ucode.ALUOp <= ANDMT;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                    endcase
                end

                3'b001: begin // XOR  / AND / OR
                    case(op_sub)
                        2'b00: begin // XOR
                            ucode.ALUOp <= XOR;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b01: begin // AND
                            ucode.ALUOp <= AND;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b10: begin // OR
                            ucode.ALUOp <= OR;
                            ucode.ALUUsePortBImm <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        default:;
                    endcase
                            
                end

                3'b010: begin // SHL / SHR / SLR
                    case(op_sub)
                        2'b10: begin // SHL/SHR
                            ucode.ALUOp <= SHIFT;
                            ucode.ALUUsePortBImm <= 1;
                            ucode.ALUShiftDirection <= Sflag;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                            ucode.OutRFWrite <= 1;
                            ucode.Immediate <= {5'b0, Simm};
                        end
                        2'b11: begin // SLR
                            ucode.ALUOp <= SHIFT;
                            ucode.ALUUsePortBImm <= 0;
                            ucode.ALUShiftDirection <= 0;

                            ucode.PortAReg <= `ACC;
                            ucode.PortAWriteEnable <= 1;

                            ucode.PortBReg <= Areg;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        default:;
                    endcase
                end

                3'b011: begin // LD / ST / MOV
                    case(op_sub)
                        2'b00: begin // LD
                            ucode.PortAReg <= Areg;
                            
                            ucode.InUseDMEM <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b01: begin // ST
                            ucode.PortAReg <= Areg;
                            ucode.PortBReg <= `ACC;

                            ucode.ALUOp <= PASSB;

                            ucode.InUseALU <= 1;
                            ucode.OutDMWrite <= 1;
                        end
                        2'b10: begin // MOV X, ACC
                            ucode.PortAReg <= Areg;
                            ucode.PortBReg <= `ACC;
                            
                            ucode.ALUOp <= PASSB;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                        2'b11: begin // MOV ACC, X
                            ucode.PortAReg <= `ACC;
                            ucode.PortBReg <= Areg;
                            
                            ucode.ALUOp <= PASSB;

                            ucode.InUseALU <= 1;
                            ucode.OutRFWrite <= 1;
                        end
                    endcase
                end
            endcase
        end
    end



endmodule