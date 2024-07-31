xrun \
+gui \
+access+rwc \
+xm64bit \
+xmstatus \
+xmtimescale+1ns/1ps \
+xmseq_udp_delay+20ps \
+xmoveride_timescale \
-define LOAD_P3 \
-v alu_ops.sv \
-v ucodeop.sv \
-v dmem.sv \
-v imem.sv \
-v pc_ctr.sv \
-v rf.sv \
-v alu.sv \
-v decode.sv \
-v core_top.sv \
p3_tb.sv