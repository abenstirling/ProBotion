# ProBotion

ProBotion is an 8-bit ISA with 9-bit instruction words optimized for FEC tasks. It is a register-accumulator machine, with 16 GPRs. Internally, it is a 4-stage multi-cycle design with a horizontal microcoding.

# Program 2

We chose to return the full repaired paritied word for P2.

# Sources
Software sources are in the /src folder. THis includes the 3 programs (one with multiple solutions) and the assembler pbasm.js

## Assembler

The assembler can be run using Node.js. See p1.js to see how it should be imported as a module.

# RTL
The RTL directory contains SystemVerilog code with the toplevel at `core_top.sv`. There are several testbenches included. Machine code is also in this folder.

Test scripts are in this folder. They are `.sh` files that invoke Cadence Xcelium 23.

# What works
There is a working pipeline and semi-working datapath. Control flow is fully compliant with the ISA. The processor initialization sequence is working. 


# What doesn't work
Some ALU operations appear to have a circular dependency that, at least in Xcelium, is resolved as X. This causes failures in all 3 programs despite successful execution of their control flow.

# Challenges
The primary challenge was ensuring that data dependencies could be resolved. The biggest complexity here was in the jump instructions, which must perform fetches from instruction memory mid-execution. For this reason, the pipeline underwent several revisions. SV Interfaces simplified this.

