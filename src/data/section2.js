export const section2 = {
  id: 2,
  title: "Bringup: What Language Is Hardware Coded In?",
  subtitle: "Verilog HDL, LED Blinker, and UART",
  duration: "0.5 weeks",
  description: "Learn Verilog hardware description language by building your first circuits: a blinking LED and a UART serial port with memory-mapped I/O.",
  longDescription: "Now that you understand what FPGAs are and how to simulate hardware, it's time to learn the language we'll use to describe circuits: Verilog. We'll start with the hardware equivalent of 'Hello World' — a blinking LED — and then build a UART serial port that will serve as our primary communication channel throughout the course.",
  topics: ["Verilog", "HDL", "LED Blinker", "UART", "Serial Port", "MMIO", "Testbenches"],
  learningGoals: [
    "Write Verilog modules with correct syntax",
    "Understand the difference between combinational and sequential logic in Verilog",
    "Build and simulate a blinking LED circuit",
    "Understand the UART serial protocol completely",
    "Implement a UART transmitter and receiver in Verilog",
    "Understand memory-mapped I/O (MMIO)",
  ],
  lessons: [
    {
      id: 1,
      title: "Verilog Fundamentals",
      subtitle: "The language of hardware design",
      duration: "1.5 hours",
      content: [
        { type: 'text', html: `
<h2>What is Verilog?</h2>
<p>Verilog is a <strong>Hardware Description Language (HDL)</strong> — it looks like a programming language but describes <strong>physical circuits</strong>, not sequential software. This is the most important mental shift you need to make:</p>

<ul>
<li>In software: statements execute <strong>one after another</strong> (sequential)</li>
<li>In hardware: everything happens <strong>at the same time</strong> (parallel)</li>
</ul>

<p>When you write Verilog, you're not writing a program that runs step-by-step. You're describing a circuit that exists in physical hardware — all parts of the circuit are "running" simultaneously, all the time.</p>

<h3>Modules: The Basic Building Block</h3>
<p>In Verilog, every circuit is a <strong>module</strong>. A module is like a chip — it has named input and output pins (called ports), and internal logic that defines its behavior.</p>
`},
        { type: 'code', label: 'Basic Verilog module structure', code: `module my_circuit (
    input  wire clk,          // Clock input
    input  wire reset,        // Reset input
    input  wire [7:0] data_in,  // 8-bit input bus
    output wire [7:0] data_out, // 8-bit output bus
    output reg  led            // Single-bit registered output
);
    // Internal logic goes here
endmodule` },
        { type: 'text', html: `
<h3>Key Concepts: wire vs reg</h3>
<ul>
<li><strong>wire:</strong> A physical connection (like a copper trace). It has no storage — it just carries a signal from one place to another. You assign to wires using <code>assign</code> statements (continuous assignment).</li>
<li><strong>reg:</strong> A variable that can hold a value. Despite the name, it doesn't always become a physical register — it depends on how you use it. You assign to regs inside <code>always</code> blocks.</li>
</ul>

<h3>Two Types of Logic</h3>
<h4>1. Combinational Logic (assign and always @(*))</h4>
<p>Output depends only on current inputs. No memory, no clock. The output updates instantly when inputs change.</p>
`},
        { type: 'code', label: 'Combinational logic examples', code: `// Using assign (for wires):
assign y = a & b;           // AND gate
assign sum = a + b;         // Adder
assign mux_out = sel ? b : a; // 2-to-1 multiplexer

// Using always @(*) (for regs — combinational):
always @(*) begin
    case (sel)
        2'b00: out = in0;
        2'b01: out = in1;
        2'b10: out = in2;
        2'b11: out = in3;
    endcase
end` },
        { type: 'text', html: `
<h4>2. Sequential Logic (always @(posedge clk))</h4>
<p>Output depends on inputs AND previous state. Uses a clock signal. Values are captured on the rising edge of the clock.</p>
`},
        { type: 'code', label: 'Sequential logic examples', code: `// Simple D flip-flop: captures 'd' on rising clock edge
always @(posedge clk) begin
    q <= d;    // '<=' is non-blocking assignment (used in sequential logic)
end

// Counter with synchronous reset
reg [7:0] counter;
always @(posedge clk) begin
    if (reset)
        counter <= 8'd0;      // Reset to 0
    else
        counter <= counter + 1; // Increment each clock cycle
end

// Register with enable
always @(posedge clk) begin
    if (enable)
        data_reg <= data_in;  // Only capture when enabled
end` },
        { type: 'info', variant: 'warning', title: 'Blocking (=) vs Non-Blocking (<=) Assignment',
          html: `<p><strong>This is the #1 source of Verilog bugs for beginners.</strong></p>
<p>Use <code>=</code> (blocking) in combinational logic (<code>always @(*)</code>).</p>
<p>Use <code><=</code> (non-blocking) in sequential logic (<code>always @(posedge clk)</code>).</p>
<p>Mixing them up will cause simulation/synthesis mismatches and subtle timing bugs. The rule is simple: if there's a clock edge, use <code><=</code>. Otherwise, use <code>=</code>.</p>` },
        { type: 'text', html: `
<h3>Number Literals in Verilog</h3>
<p>Verilog numbers are written as <code>size'base_value</code>:</p>
`},
        { type: 'table', headers: ['Literal', 'Meaning', 'Decimal Value'],
          rows: [
            ["<code>8'd255</code>", '8-bit decimal 255', '255'],
            ["<code>8'hFF</code>", '8-bit hexadecimal FF', '255'],
            ["<code>8'b11111111</code>", '8-bit binary', '255'],
            ["<code>4'b1010</code>", '4-bit binary', '10'],
            ["<code>32'h0000_DEAD</code>", '32-bit hex (underscores for readability)', '57005'],
            ["<code>1'b0</code>", '1-bit value zero', '0'],
          ]
        },
        { type: 'text', html: `
<h3>Operators</h3>
`},
        { type: 'table', headers: ['Category', 'Operators', 'Example'],
          rows: [
            ['Bitwise', '<code>&amp; | ^ ~ ^~</code>', '<code>a &amp; b</code> (AND each bit)'],
            ['Logical', '<code>&amp;&amp; || !</code>', '<code>a &amp;&amp; b</code> (true/false)'],
            ['Arithmetic', '<code>+ - * / %</code>', '<code>a + b</code>'],
            ['Shift', '<code>&lt;&lt; &gt;&gt;</code>', '<code>a &lt;&lt; 2</code> (shift left by 2)'],
            ['Comparison', '<code>== != &lt; &gt; &lt;= &gt;=</code>', '<code>a == b</code>'],
            ['Concatenation', '<code>{ }</code>', '<code>{a, b}</code> (join signals)'],
            ['Replication', '<code>{ { } }</code>', "<code>{4{1'b0}}</code> = 4-bit zero"],
            ['Ternary', '<code>? :</code>', '<code>sel ? a : b</code>'],
          ]
        },
        { type: 'text', html: `
<h3>Module Instantiation (Connecting Modules Together)</h3>
<p>Just like calling functions in software, you can use one module inside another:</p>
`},
        { type: 'code', label: 'Instantiating a module', code: `// Define a full adder module
module full_adder (
    input wire a, b, cin,
    output wire sum, cout
);
    assign sum = a ^ b ^ cin;
    assign cout = (a & b) | (a & cin) | (b & cin);
endmodule

// Use it in a larger design
module four_bit_adder (
    input wire [3:0] a, b,
    input wire cin,
    output wire [3:0] sum,
    output wire cout
);
    wire c1, c2, c3;

    // Instantiate 4 full adders and chain the carries
    full_adder fa0 (.a(a[0]), .b(b[0]), .cin(cin),  .sum(sum[0]), .cout(c1));
    full_adder fa1 (.a(a[1]), .b(b[1]), .cin(c1),   .sum(sum[1]), .cout(c2));
    full_adder fa2 (.a(a[2]), .b(b[2]), .cin(c2),   .sum(sum[2]), .cout(c3));
    full_adder fa3 (.a(a[3]), .b(b[3]), .cin(c3),   .sum(sum[3]), .cout(cout));
endmodule` },
        { type: 'video', id: 'PJGvZSlsLKs', title: 'Verilog HDL Basics — Neso Academy' },
        { type: 'video', id: 'lLg1AgA2Xoo', title: 'Introduction to FPGA Part 1 (covers Verilog in Part 3) — DigiKey / Shawn Hymel' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Write a Verilog module for a 2-to-4 decoder (2 select inputs, 4 outputs, only one output high at a time)',
          'Implement an 8-to-1 multiplexer using a case statement',
          'Build a 4-bit register with synchronous reset and write-enable',
          'Create a parameterized counter module: <code>module counter #(parameter WIDTH=8)</code> that counts from 0 to 2^WIDTH-1',
          'Write a Verilog module that takes two 8-bit inputs and outputs the larger one',
          'Simulate all of the above with Verilator and verify correctness',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'ASIC World: Verilog Tutorial', url: 'https://www.asic-world.com/verilog/veritut.html', desc: 'Comprehensive Verilog reference' },
          { type: 'Tutorial', title: 'HDLBits — Verilog Practice', url: 'https://hdlbits.01xz.net/wiki/Main_Page', desc: 'Interactive Verilog exercises with instant feedback — the best way to learn Verilog' },
          { type: 'Reference', title: 'ChipVerify: Verilog Tutorial', url: 'https://www.chipverify.com/verilog/verilog-tutorial', desc: 'Well-organized Verilog reference covering modules, wires, regs, always blocks' },
          { type: 'Tutorial', title: 'Nandland: Introduction to Verilog for Beginners', url: 'https://nandland.com/introduction-to-verilog-for-beginners-with-code-examples/', desc: 'Beginner-friendly Verilog guide with code examples' },
          { type: 'Tutorial', title: 'FPGA Tutorial: How to Write a Basic Verilog Module', url: 'https://fpgatutorial.com/how-to-write-a-basic-verilog-module/', desc: 'Step-by-step module creation guide' },
          { type: 'Video Series', title: 'Neso Academy: Verilog', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3G9fAsa7wYQ0IrcfHi', desc: 'Thorough video lecture series on Verilog HDL' },
          { type: 'Video Series', title: 'DigiKey: Introduction to FPGA (12-part series)', url: 'https://www.youtube.com/watch?v=lLg1AgA2Xoo&list=PLEBQazB0HUyT1WmMONxRZn9NmQ_9CIKhb', desc: 'Part 3 covers Verilog basics, Part 7 covers testbenches' },
          { type: 'Article', title: 'GeeksforGeeks: Getting Started with Verilog', url: 'https://www.geeksforgeeks.org/electronics-engineering/getting-started-with-verilog/', desc: 'Quick-start overview of Verilog concepts' },
          { type: 'Reference', title: 'ChipVerify: Wire vs Reg', url: 'https://blog.waynejohnson.net/doku.php/verilog_wire_and_reg', desc: 'Clear explanation of the wire vs reg distinction' },
        ]},
      ],
    },
    {
      id: 2,
      title: "Blinking an LED",
      subtitle: "Hardware's Hello World",
      duration: "45 min",
      content: [
        { type: 'text', html: `
<h2>The Hello World of Hardware</h2>
<p>In software, your first program prints "Hello World." In hardware, your first design blinks an LED. This simple project teaches you clock-based timing, counters, and the fundamental Verilog patterns you'll use everywhere.</p>

<h3>The Core Idea</h3>
<p>An FPGA has a clock signal running at a fixed frequency (e.g., 50 MHz = 50 million cycles per second). To blink an LED at a human-visible rate (say 1 Hz = once per second), we need a counter that counts clock cycles and toggles the LED when it reaches the right count.</p>

<p>At 50 MHz, one second = 50,000,000 cycles. So we count to 25,000,000, toggle the LED, count again, toggle again — and we get a 1 Hz blink.</p>
`},
        { type: 'code', label: 'led_blink.v — Complete LED blinker', code: `module led_blink #(
    parameter CLK_FREQ = 50_000_000  // Clock frequency in Hz (50 MHz default)
)(
    input  wire clk,     // System clock
    input  wire reset,   // Active-high reset
    output reg  led      // LED output
);

    // We need to count to CLK_FREQ/2 to get a 1-second period
    // (toggle every half-second)
    localparam HALF_PERIOD = CLK_FREQ / 2;

    // Counter needs enough bits to hold HALF_PERIOD
    // $clog2 computes ceil(log2(n)) — gives us the bit width needed
    reg [$clog2(HALF_PERIOD)-1:0] counter;

    always @(posedge clk) begin
        if (reset) begin
            counter <= 0;
            led <= 1'b0;
        end else if (counter == HALF_PERIOD - 1) begin
            counter <= 0;
            led <= ~led;    // Toggle the LED
        end else begin
            counter <= counter + 1;
        end
    end

endmodule` },
        { type: 'text', html: `
<h3>Simulating the LED Blinker</h3>
<p>We can't wait 50 million cycles in simulation! Instead, we'll use a much lower clock frequency parameter for testing, then change it back for real hardware.</p>
`},
        { type: 'code', label: 'tb_led_blink.cpp — Testbench', code: `#include <stdio.h>
#include "Vled_blink.h"
#include "verilated.h"
#include "verilated_vcd_c.h"

int main(int argc, char **argv) {
    Verilated::commandArgs(argc, argv);
    Verilated::traceEverOn(true);

    // Instantiate with small CLK_FREQ for fast simulation
    Vled_blink *dut = new Vled_blink;
    VerilatedVcdC *trace = new VerilatedVcdC;
    dut->trace(trace, 5);
    trace->open("led_blink.vcd");

    // Reset
    dut->reset = 1;
    dut->clk = 0;
    for (int i = 0; i < 4; i++) {
        dut->clk = !dut->clk;
        dut->eval();
        trace->dump(i);
    }
    dut->reset = 0;

    // Run for enough cycles to see several toggles
    // With default CLK_FREQ=50M this would take forever,
    // so override the parameter or use a small value
    int sim_time = 4;
    int last_led = dut->led;
    int toggles = 0;

    for (int i = 0; i < 200; i++) {
        dut->clk = !dut->clk;
        dut->eval();
        trace->dump(sim_time++);

        if (dut->clk && dut->led != last_led) {
            printf("LED toggled at time %d: %d -> %d\\n",
                   sim_time, last_led, dut->led);
            last_led = dut->led;
            toggles++;
        }
    }

    printf("Total toggles observed: %d\\n", toggles);
    trace->close();
    delete dut;
    return 0;
}` },
        { type: 'info', variant: 'tip', title: 'Simulation Tip: Use Parameters',
          html: '<p>For simulation, override the CLK_FREQ parameter to a small value like 10 so the LED toggles every 5 clock cycles. In Verilator, you can set parameters with <code>-GCLK_FREQ=10</code> on the command line, or modify the parameter in a wrapper module.</p>' },
        { type: 'text', html: `
<h3>Understanding the Pattern</h3>
<p>This LED blinker uses a pattern you'll see again and again in digital design:</p>
<ol>
<li><strong>Counter:</strong> Count clock cycles</li>
<li><strong>Comparator:</strong> Check if we've reached a target count</li>
<li><strong>Action:</strong> Do something when the count is reached (toggle, latch, signal, etc.)</li>
<li><strong>Reset:</strong> Reset the counter and start over</li>
</ol>
<p>This same pattern drives UART timing, CPU instruction fetch, memory controllers, and more. Master it here.</p>
`},
        { type: 'video', id: 'WnlXlPBz1p4', title: 'Your First FPGA Project — LED Blinker (Nandland)' },
        { type: 'video', id: 'gI-qXk7XojA', title: 'Boolean Logic & Logic Gates — Crash Course Computer Science #3' },
        { type: 'video', id: 'QZwneRb-zqA', title: 'Exploring How Computers Work — Building Logic into Adders and ALU (Sebastian Lague)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Modify the blinker to blink at 2 Hz instead of 1 Hz',
          'Add a second LED that blinks at half the rate of the first (use the first LED as a clock for a second counter, or use a wider counter)',
          'Create a "breathing" LED effect: use a PWM (pulse width modulation) counter to gradually increase and decrease LED brightness',
          'Build a 4-bit binary counter that drives 4 LEDs, counting up every 0.5 seconds',
          'Add a button input that pauses/resumes the blinking',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Nandland: Your First Verilog Program — An LED Blinker', url: 'https://nandland.com/your-first-verilog-program-an-led-blinker/', desc: 'Step-by-step LED blinker tutorial with explanations' },
          { type: 'Tutorial', title: 'Circuit Fever: LED Blinking in FPGA using Verilog', url: 'https://circuitfever.com/led-blinking-in-fpga-verilog', desc: 'Practical LED blinking guide for FPGA' },
          { type: 'Article', title: 'ZipCPU: Blinky — Your First FPGA Design', url: 'https://zipcpu.com/blog/2017/05/19/blinky.html', desc: 'In-depth analysis of the blinky design from a hardware perspective' },
          { type: 'Article', title: 'GeeksforGeeks: Combinational vs Sequential Circuits', url: 'https://www.geeksforgeeks.org/digital-logic/difference-between-combinational-and-sequential-circuit/', desc: 'Clear comparison of combinational and sequential logic' },
        ]},
      ],
    },
    {
      id: 3,
      title: "UART: Serial Communication",
      subtitle: "Building a serial port from scratch",
      duration: "2 hours",
      content: [
        { type: 'text', html: `
<h2>What is UART?</h2>
<p><strong>UART</strong> (Universal Asynchronous Receiver/Transmitter) is one of the oldest and simplest communication protocols. It sends data one bit at a time over a single wire, without a shared clock signal — sender and receiver must agree on the speed (baud rate) in advance.</p>

<p>UART is important for our project because it will be our CPU's primary way to communicate with the outside world — we'll use it for our serial console, bootloader, and debugging output.</p>

<h3>The UART Protocol</h3>
<p>When the line is idle, it sits at HIGH (1). To send a byte:</p>
`},
        { type: 'diagram', content: `
UART Frame for sending byte 0x55 (01010101) at 9600 baud:

     IDLE  START  D0  D1  D2  D3  D4  D5  D6  D7  STOP  IDLE
      ___        ___     ___     ___     ___              ___
HIGH |   |      |   |   |   |   |   |   |   |           |
     |   |      |   |   |   |   |   |   |   |           |
LOW  |   |______|   |___|   |___|   |___|   |___________|

     1    0      1   0   1   0   1   0   1   0    1       1

     |←──── Bit period = 1/9600 = ~104 μs ────→|

Protocol:
1. IDLE:  Line held HIGH
2. START: Line pulled LOW for one bit period (signals start of byte)
3. DATA:  8 data bits, LSB first (least significant bit first)
4. STOP:  Line held HIGH for one bit period (signals end of byte)

Common baud rates: 9600, 19200, 38400, 57600, 115200` },
        { type: 'text', html: `
<h3>UART Transmitter (TX)</h3>
<p>The transmitter converts a parallel 8-bit byte into a serial bit stream. It uses a state machine:</p>
<ol>
<li><strong>IDLE:</strong> Wait for data to send. TX line = HIGH.</li>
<li><strong>START:</strong> Pull TX LOW for one bit period.</li>
<li><strong>DATA:</strong> Send 8 data bits, LSB first, one bit per period.</li>
<li><strong>STOP:</strong> Hold TX HIGH for one bit period.</li>
</ol>
`},
        { type: 'code', label: 'uart_tx.v — UART Transmitter', code: `module uart_tx #(
    parameter CLK_FREQ  = 50_000_000,  // System clock frequency
    parameter BAUD_RATE = 115200        // Desired baud rate
)(
    input  wire       clk,
    input  wire       reset,
    input  wire [7:0] tx_data,    // Byte to transmit
    input  wire       tx_start,   // Pulse high to begin transmission
    output reg        tx_out,     // Serial output line
    output reg        tx_busy     // High while transmitting
);

    localparam CLKS_PER_BIT = CLK_FREQ / BAUD_RATE;

    // State machine states
    localparam IDLE  = 3'd0;
    localparam START = 3'd1;
    localparam DATA  = 3'd2;
    localparam STOP  = 3'd3;

    reg [2:0]  state;
    reg [15:0] clk_count;    // Counts clocks per bit period
    reg [2:0]  bit_index;    // Which data bit we're sending (0-7)
    reg [7:0]  tx_shift;     // Shift register holding the byte

    always @(posedge clk) begin
        if (reset) begin
            state     <= IDLE;
            tx_out    <= 1'b1;   // Idle HIGH
            tx_busy   <= 1'b0;
            clk_count <= 0;
            bit_index <= 0;
        end else begin
            case (state)
                IDLE: begin
                    tx_out  <= 1'b1;
                    tx_busy <= 1'b0;
                    if (tx_start) begin
                        tx_shift  <= tx_data;
                        state     <= START;
                        tx_busy   <= 1'b1;
                        clk_count <= 0;
                    end
                end

                START: begin
                    tx_out <= 1'b0;  // Start bit = LOW
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        clk_count <= 0;
                        bit_index <= 0;
                        state     <= DATA;
                    end else begin
                        clk_count <= clk_count + 1;
                    end
                end

                DATA: begin
                    tx_out <= tx_shift[0]; // LSB first
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        clk_count <= 0;
                        tx_shift  <= tx_shift >> 1; // Shift right for next bit
                        if (bit_index == 7) begin
                            state <= STOP;
                        end else begin
                            bit_index <= bit_index + 1;
                        end
                    end else begin
                        clk_count <= clk_count + 1;
                    end
                end

                STOP: begin
                    tx_out <= 1'b1;  // Stop bit = HIGH
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        state <= IDLE;
                    end else begin
                        clk_count <= clk_count + 1;
                    end
                end

                default: state <= IDLE;
            endcase
        end
    end
endmodule` },
        { type: 'text', html: `
<h3>UART Receiver (RX)</h3>
<p>The receiver is trickier because it must detect the start bit edge and then sample data bits at the center of each bit period for reliability:</p>
`},
        { type: 'code', label: 'uart_rx.v — UART Receiver', code: `module uart_rx #(
    parameter CLK_FREQ  = 50_000_000,
    parameter BAUD_RATE = 115200
)(
    input  wire       clk,
    input  wire       reset,
    input  wire       rx_in,       // Serial input line
    output reg  [7:0] rx_data,     // Received byte
    output reg        rx_valid     // Pulses high for one clock when byte is ready
);

    localparam CLKS_PER_BIT = CLK_FREQ / BAUD_RATE;

    localparam IDLE  = 3'd0;
    localparam START = 3'd1;
    localparam DATA  = 3'd2;
    localparam STOP  = 3'd3;

    reg [2:0]  state;
    reg [15:0] clk_count;
    reg [2:0]  bit_index;
    reg [7:0]  rx_shift;

    // Synchronize rx_in to our clock domain (prevent metastability)
    reg rx_sync1, rx_sync2;
    always @(posedge clk) begin
        rx_sync1 <= rx_in;
        rx_sync2 <= rx_sync1;
    end

    always @(posedge clk) begin
        if (reset) begin
            state    <= IDLE;
            rx_valid <= 1'b0;
        end else begin
            rx_valid <= 1'b0;  // Default: no valid data

            case (state)
                IDLE: begin
                    if (rx_sync2 == 1'b0) begin  // Falling edge = start bit
                        state     <= START;
                        clk_count <= 0;
                    end
                end

                START: begin
                    // Wait until middle of start bit to verify it's still low
                    if (clk_count == CLKS_PER_BIT / 2) begin
                        if (rx_sync2 == 1'b0) begin
                            // Valid start bit — begin receiving data
                            clk_count <= 0;
                            bit_index <= 0;
                            state     <= DATA;
                        end else begin
                            state <= IDLE;  // False start — glitch
                        end
                    end else begin
                        clk_count <= clk_count + 1;
                    end
                end

                DATA: begin
                    // Sample at the middle of each data bit
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        clk_count <= 0;
                        rx_shift[bit_index] <= rx_sync2;
                        if (bit_index == 7) begin
                            state <= STOP;
                        end else begin
                            bit_index <= bit_index + 1;
                        end
                    end else begin
                        clk_count <= clk_count + 1;
                    end
                end

                STOP: begin
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        rx_data  <= rx_shift;
                        rx_valid <= 1'b1;   // Signal that a byte is ready
                        state    <= IDLE;
                    end else begin
                        clk_count <= clk_count + 1;
                    end
                end

                default: state <= IDLE;
            endcase
        end
    end
endmodule` },
        { type: 'info', variant: 'info', title: 'Metastability and Synchronization',
          html: '<p>Notice the two-stage synchronizer (<code>rx_sync1</code>, <code>rx_sync2</code>) on the RX input. The incoming serial signal is asynchronous — it can change at any time relative to our clock. If we read it directly, the flip-flop might enter a <strong>metastable state</strong> (neither 0 nor 1) which can cause unpredictable behavior. The two flip-flop chain dramatically reduces this risk — this is a standard technique in all digital designs that cross clock domains.</p>' },
        { type: 'text', html: `
<h3>Memory-Mapped I/O (MMIO)</h3>
<p>Now that we have a UART module, how will our CPU talk to it? Through <strong>Memory-Mapped I/O (MMIO)</strong>.</p>

<p>The idea is simple: instead of special I/O instructions, we assign hardware registers to specific memory addresses. When the CPU reads from or writes to those addresses, it's actually communicating with the hardware device, not RAM.</p>
`},
        { type: 'diagram', content: `
Memory Map Example:

Address Range        | Device
---------------------|-----------------
0x00000000-0x0000FFFF | RAM (64 KB)
0x10000000           | UART Data Register (read = RX byte, write = TX byte)
0x10000004           | UART Status Register (bit 0 = TX busy, bit 1 = RX valid)
0x10000008           | UART Control Register (baud rate config, etc.)
0x20000000           | LED Register (write bits to control LEDs)

CPU executing: "store R1, [0x10000000]"
→ This doesn't write to RAM
→ It sends the byte in R1 to the UART transmitter!

CPU executing: "load R2, [0x10000004]"
→ This reads the UART status register
→ R2 gets the current TX busy / RX valid flags` },
        { type: 'code', label: 'uart_mmio.v — UART with memory-mapped interface', code: `module uart_mmio #(
    parameter CLK_FREQ  = 50_000_000,
    parameter BAUD_RATE = 115200,
    parameter BASE_ADDR = 32'h10000000
)(
    input  wire        clk,
    input  wire        reset,
    // Bus interface (from CPU)
    input  wire [31:0] addr,
    input  wire [31:0] wdata,
    output reg  [31:0] rdata,
    input  wire        wen,     // Write enable
    input  wire        ren,     // Read enable
    // Physical UART pins
    output wire        uart_tx,
    input  wire        uart_rx
);

    // Internal signals
    wire [7:0] rx_data;
    wire       rx_valid;
    wire       tx_busy;
    reg  [7:0] tx_data;
    reg        tx_start;
    reg  [7:0] rx_buffer;
    reg        rx_ready;

    // Instantiate TX and RX
    uart_tx #(.CLK_FREQ(CLK_FREQ), .BAUD_RATE(BAUD_RATE)) u_tx (
        .clk(clk), .reset(reset),
        .tx_data(tx_data), .tx_start(tx_start),
        .tx_out(uart_tx), .tx_busy(tx_busy)
    );

    uart_rx #(.CLK_FREQ(CLK_FREQ), .BAUD_RATE(BAUD_RATE)) u_rx (
        .clk(clk), .reset(reset),
        .rx_in(uart_rx),
        .rx_data(rx_data), .rx_valid(rx_valid)
    );

    // Buffer received byte
    always @(posedge clk) begin
        if (reset) begin
            rx_ready <= 0;
        end else if (rx_valid) begin
            rx_buffer <= rx_data;
            rx_ready  <= 1;
        end else if (ren && addr == BASE_ADDR) begin
            rx_ready <= 0;  // Clear on read
        end
    end

    // Handle bus writes
    always @(posedge clk) begin
        tx_start <= 0;
        if (wen && addr == BASE_ADDR) begin
            tx_data  <= wdata[7:0];
            tx_start <= 1;
        end
    end

    // Handle bus reads
    always @(*) begin
        rdata = 32'd0;
        if (ren) begin
            case (addr)
                BASE_ADDR:     rdata = {24'd0, rx_buffer};
                BASE_ADDR + 4: rdata = {30'd0, rx_ready, tx_busy};
                default:       rdata = 32'd0;
            endcase
        end
    end

endmodule` },
        { type: 'video', id: 'eq5YpKHXwDM', title: 'UART Protocol Explained (Nandland)' },
        { type: 'video', id: 'AHYNxpqKqwo', title: 'The RS-232 Protocol — Serial Communication Deep Dive (Ben Eater)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Simulate the UART TX module: send the ASCII character "A" (0x41) and verify the bit pattern on tx_out matches the UART protocol',
          'Connect UART TX output to UART RX input (loopback test) and verify that a sent byte is received correctly',
          'Modify the UART to support configurable data bits (7 or 8) and optional parity bit',
          'Add a TX FIFO buffer (small circular buffer) so the CPU can queue multiple bytes for transmission',
          'Write a testbench that sends the string "Hello\\n" through the UART and captures the output',
          'Implement a simple bus arbiter that routes reads/writes to either RAM or UART based on address range',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Nandland: What is a UART?', url: 'https://nandland.com/uart-serial-port-module/', desc: 'Clear UART protocol explanation with Verilog and VHDL code' },
          { type: 'Tutorial', title: 'Nandland: UART RX Project', url: 'https://nandland.com/project-7-uart-part-1-receive-data-from-computer/', desc: 'Step-by-step UART receiver implementation with Go Board' },
          { type: 'Tutorial', title: 'Nandland: UART TX Project', url: 'https://nandland.com/project-8-uart-part-2-transmit-data-to-computer/', desc: 'Step-by-step UART transmitter implementation' },
          { type: 'Article', title: 'Circuit Basics: UART Communication', url: 'https://www.circuitbasics.com/basics-uart-communication/', desc: 'Visual guide to UART protocol with clear diagrams' },
          { type: 'Article', title: 'Analog Devices: UART Protocol', url: 'https://www.analog.com/en/resources/analog-dialogue/articles/uart-a-hardware-communication-protocol.html', desc: 'In-depth technical reference for UART' },
          { type: 'Article', title: 'GeeksforGeeks: Memory-Mapped I/O', url: 'https://www.geeksforgeeks.org/computer-organization-architecture/memory-mapped-i-o-and-isolated-i-o/', desc: 'MMIO vs port-mapped I/O comparison' },
          { type: 'Article', title: 'DEV Community: Memory Mapped IO (MMIO)', url: 'https://dev.to/ripan030/memory-mapped-io-mmio-5bn8', desc: 'Beginner-friendly MMIO explanation with examples' },
          { type: 'Code', title: 'ben-marshall/uart (GitHub)', url: 'https://github.com/ben-marshall/uart', desc: 'Simple UART modem implementation in Verilog' },
          { type: 'Code', title: 'alexforencich/verilog-uart (GitHub)', url: 'https://github.com/alexforencich/verilog-uart', desc: 'Production-quality UART with AXI Stream interface and cocotb testbenches' },
          { type: 'Video', title: 'Ben Eater: The RS-232 Protocol', url: 'https://www.youtube.com/watch?v=AHYNxpqKqwo', desc: '31-min deep dive into serial communication — baud rate, start/stop bits, framing' },
          { type: 'Tutorial', title: 'FPGA Tutorial: How to Write a Verilog Testbench', url: 'https://fpgatutorial.com/how-to-write-a-basic-verilog-testbench/', desc: 'Step-by-step testbench writing guide' },
          { type: 'Tutorial', title: "It's Embedded: Verilator Tutorial Series", url: 'https://itsembedded.com/dhd/verilator_1/', desc: 'Beginner-friendly Verilator guide with C++ testbenches' },
          { type: 'Tutorial', title: 'ZipCPU: Verilog, Formal Verification and Verilator Tutorial', url: 'https://zipcpu.com/tutorial/', desc: 'From C++ to Verilator proficiency, includes formal verification' },
        ]},
      ],
    },
  ],
}
