// CSE141L  
// test bench for program 3
module prog3_tb();

bit   clk   ,                 // clock source -- drives DUT input of same name
	  req   ;	             // req -- start next program -- drives DUT input
wire  done;		    	         // ack -- from DUT -- done w/ program

// program 3-specific variables
logic[  7:0] cto,		       // how many bytes hold the pattern? (32 max)
             cts,		       // how many patterns in the whole string? (253 max)
		     ctb;		       // how many patterns fit inside any byte? (160 max)
logic        ctp;		       // flags occurrence of patern in a given byte
logic[  4:0] pat;              // pattern to search for
logic[255:0] str2; 	           // message string
logic[  7:0] mat_str[32];      // message string parsed into bytes

// your device goes here
// explicitly list ports if your names differ from test bench's
top_level DUT(.clk(clk), start(req),.done(done));	               // replace "proc" with the name of your top level module

initial begin
// program 3
// pattern we are looking for; experiment w/ various values
  pat = 5'b0000;//5'b10101;//$random;//5'b11111;
  str2 = 0;
  DUT.dm1.store[32] = {pat,3'b0};
  for(int i=0; i<32; i++) begin
// search field; experiment w/ various vales
    mat_str[i] = 8'b00000000;//8'b01010101;// $random;// 8'b11111111;
	DUT.dm1.store[i] = mat_str[i];   
	str2 = (str2<<8)+mat_str[i];
  end
  ctb = 0;
  for(int j=0; j<32; j++) begin
    if(pat==mat_str[j][4:0]) ctb++;
    if(pat==mat_str[j][5:1]) ctb++;
    if(pat==mat_str[j][6:2]) ctb++;
    if(pat==mat_str[j][7:3]) ctb++;
  end
  cto = 0;
  for(int j=0; j<32; j++) 
    if((pat==mat_str[j][4:0]) | (pat==mat_str[j][5:1]) |
       (pat==mat_str[j][6:2]) | (pat==mat_str[j][7:3])) cto ++;
  cts = 0;
  for(int j=0; j<252; j++) begin
    if(pat==str2[255:251]) cts++;
	str2 = str2<<1;
  end        	    
  #10ns req   = 1'b1;      // pulse request to DUT
  #10ns req   = 1'b0;
  wait(ack);               // wait for ack from DUT
  $display();
  $display("start program 3");
  $display();
  $display("number of patterns w/o byte crossing    = %d %d",ctb,DUT.dm1.store[33]);   //160 max
  $display("number of bytes w/ at least one pattern = %d %d",cto,DUT.dm1.store[34]);   // 32 max
  $display("number of patterns w/ byte crossing     = %d %d",cts,DUT.dm1.store[35]);   //253 max
  #10ns $stop;
end

always begin
  #5ns clk = 1;            // tic
  #5ns clk = 0;			   // toc
end										

endmodule
										   