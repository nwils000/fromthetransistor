export const section1 = {
  id: 1,
  title: "Intro: Cheating Our Way Past the Transistor",
  subtitle: "Transistors, FPGAs, and Simulation",
  duration: "0.5 weeks",
  description: "Understand transistors, logic gates, FPGAs, and how we'll simulate our hardware designs using Verilator instead of building physical chips.",
  longDescription: "At the lowest level, modern computers are made of billions of transistors — tiny electronic switches that form the foundation of all digital logic. In this section, we won't physically build transistors (that requires a semiconductor fab), but we'll understand how they work and then 'cheat' our way past them using FPGAs and simulation tools. By the end, you'll know how transistors become logic gates, how FPGAs let us build custom digital circuits, and how Verilator lets us test everything in software.",
  topics: ["Transistors", "Logic Gates", "Boolean Algebra", "FPGAs", "LUTs", "Verilator"],
  learningGoals: [
    "Understand how transistors function as electronic switches",
    "Know how logic gates are built from transistors",
    "Master basic Boolean algebra and truth tables",
    "Understand FPGA architecture and Look-Up Tables (LUTs)",
    "Install and use Verilator to simulate hardware designs",
  ],
  lessons: [
    {
      id: 1,
      title: "How Transistors Work",
      subtitle: "The fundamental building block of all computing",
      duration: "45 min",
      content: [
        { type: 'text', html: `
<h2>The Transistor: Where It All Begins</h2>
<p>Every computer, phone, and digital device you've ever used is built from <strong>transistors</strong> — tiny electronic switches that can be turned on or off by applying a small electrical signal. A modern CPU contains <strong>billions</strong> of them. But what actually is a transistor?</p>

<p>At its core, a transistor is a <strong>semiconductor device</strong> with three terminals. Think of it like a water valve: a small force on the handle (one terminal) controls a much larger flow of water between the other two terminals. Similarly, a small current or voltage at one terminal of a transistor controls a larger current flowing between the other two.</p>

<h3>The Physics (Simplified)</h3>
<p>Transistors are made from <strong>silicon</strong>, a semiconductor — a material that's neither a great conductor (like copper) nor a great insulator (like rubber). By adding tiny amounts of other elements (called "doping"), we can create two types of silicon:</p>
<ul>
<li><strong>N-type:</strong> Has extra electrons (negative charge carriers). Doped with elements like phosphorus.</li>
<li><strong>P-type:</strong> Has "holes" — spots where electrons are missing (positive charge carriers). Doped with elements like boron.</li>
</ul>

<p>When you sandwich these types together (N-P-N or P-N-P), you get a transistor. The junction between the layers creates a <strong>depletion zone</strong> where no current flows — until you apply a voltage to the middle layer (the "base" or "gate"), which allows current to flow through.</p>

<h3>Types of Transistors</h3>
<p>There are two main families you need to know about:</p>
` },
        { type: 'table', headers: ['Type', 'Terminals', 'How It Switches', 'Used In'],
          rows: [
            ['<strong>BJT</strong> (Bipolar Junction)', 'Base, Collector, Emitter', 'Small current at base controls large current from collector to emitter', 'Amplifiers, analog circuits'],
            ['<strong>MOSFET</strong> (Metal-Oxide-Semiconductor)', 'Gate, Drain, Source', 'Voltage at gate controls current from drain to source', 'Digital logic, CPUs, memory — virtually all modern chips'],
          ]
        },
        { type: 'text', html: `
<p><strong>MOSFETs</strong> are what modern digital circuits use because they're smaller, faster, use less power, and are easier to manufacture in the billions. There are two flavors:</p>
<ul>
<li><strong>NMOS:</strong> Turns ON when the gate voltage is HIGH. (Connects drain to source = pulls output LOW)</li>
<li><strong>PMOS:</strong> Turns ON when the gate voltage is LOW. (Connects drain to source = pulls output HIGH)</li>
</ul>
<p>When you combine NMOS and PMOS transistors together, you get <strong>CMOS</strong> (Complementary MOS) — the technology that powers virtually every digital chip made today.</p>

<h3>From Transistor to Logic Gate</h3>
<p>Here's the magical insight: by connecting transistors in specific arrangements, we can make circuits that perform <strong>logical operations</strong>. Let's build the simplest one — a NOT gate (inverter):</p>
`},
        { type: 'diagram', content: `
    VDD (Power)
     |
    [PMOS]---+
     |       |
 Input---+   +--- Output
     |       |
    [NMOS]---+
     |
    GND (Ground)

When Input = HIGH (1):
  NMOS turns ON  → connects Output to GND  → Output = LOW (0)
  PMOS turns OFF → disconnects from VDD

When Input = LOW (0):
  PMOS turns ON  → connects Output to VDD  → Output = HIGH (1)
  NMOS turns OFF → disconnects from GND

Result: Output = NOT(Input)  ✓` },
        { type: 'text', html: `
<p>This is a <strong>CMOS inverter</strong> — the simplest logic gate. Notice: exactly one transistor is always ON and one is always OFF, so there's never a direct path from VDD to GND (meaning very low power consumption when not switching). This is why CMOS is so efficient.</p>

<h3>Building More Gates</h3>
<p>By combining more transistors, we can build any logic gate:</p>
`},
        { type: 'diagram', content: `
NAND Gate (2 PMOS in parallel + 2 NMOS in series):

    VDD         VDD
     |           |
   [PMOS_A]   [PMOS_B]     ← Either PMOS on pulls output HIGH
     |           |
     +-----+-----+
           |
         Output
           |
     +-----+-----+
     |           |
   [NMOS_A]              ← Both NMOS must be on to pull LOW
     |
   [NMOS_B]
     |
    GND

Truth Table:
  A | B | Output
  0 | 0 |   1
  0 | 1 |   1
  1 | 0 |   1
  1 | 1 |   0      ← Only LOW when BOTH inputs are HIGH` },
        { type: 'info', variant: 'tip', title: 'Why NAND is Special',
          html: '<p>The NAND gate is called a <strong>universal gate</strong> because you can build ANY other logic gate (AND, OR, NOT, XOR) using only NAND gates. This means an entire computer can theoretically be built from just NAND gates! This is the basis of the "NAND to Tetris" educational approach.</p>' },
        { type: 'text', html: `
<h3>All the Basic Logic Gates</h3>
<p>Here are the fundamental logic gates and their truth tables:</p>
`},
        { type: 'table', headers: ['Gate', 'Symbol', 'A=0,B=0', 'A=0,B=1', 'A=1,B=0', 'A=1,B=1', 'Description'],
          rows: [
            ['NOT', '!A', '1', '-', '0', '-', 'Inverts the input'],
            ['AND', 'A&B', '0', '0', '0', '1', 'Output 1 only when both inputs are 1'],
            ['OR', 'A|B', '0', '1', '1', '1', 'Output 1 when any input is 1'],
            ['NAND', '!(A&B)', '1', '1', '1', '0', 'Opposite of AND — universal gate'],
            ['NOR', '!(A|B)', '1', '0', '0', '0', 'Opposite of OR — also universal'],
            ['XOR', 'A^B', '0', '1', '1', '0', 'Output 1 when inputs differ'],
          ]
        },
        { type: 'text', html: `
<h3>Boolean Algebra</h3>
<p>Boolean algebra is the mathematics of logic gates. Variables are either 0 (false) or 1 (true). The key operations are:</p>
<ul>
<li><strong>AND (conjunction):</strong> Written as A · B or AB. True only when both A and B are true.</li>
<li><strong>OR (disjunction):</strong> Written as A + B. True when either A or B (or both) are true.</li>
<li><strong>NOT (negation):</strong> Written as A̅ or !A. Flips the value.</li>
</ul>

<h4>Key Laws of Boolean Algebra</h4>
`},
        { type: 'table', headers: ['Law', 'AND Form', 'OR Form'],
          rows: [
            ['Identity', 'A · 1 = A', 'A + 0 = A'],
            ['Null', 'A · 0 = 0', 'A + 1 = 1'],
            ['Complement', 'A · !A = 0', 'A + !A = 1'],
            ['Idempotent', 'A · A = A', 'A + A = A'],
            ['Commutative', 'A · B = B · A', 'A + B = B + A'],
            ['Associative', '(A·B)·C = A·(B·C)', '(A+B)+C = A+(B+C)'],
            ['Distributive', 'A·(B+C) = A·B + A·C', 'A+(B·C) = (A+B)·(A+C)'],
            ["De Morgan's", '!(A·B) = !A + !B', '!(A+B) = !A · !B'],
          ]
        },
        { type: 'info', variant: 'info', title: "De Morgan's Laws are Crucial",
          html: "<p>De Morgan's Laws tell us that a NAND gate is equivalent to an OR gate with inverted inputs, and a NOR gate is equivalent to an AND gate with inverted inputs. These laws are used constantly in digital design to simplify and optimize circuits.</p>" },
        { type: 'text', html: `
<h3>From Gates to Computing</h3>
<p>With just these basic gates, we can build increasingly complex circuits:</p>
<ol>
<li><strong>Combinational circuits:</strong> Output depends only on current inputs (adders, multiplexers, decoders)</li>
<li><strong>Sequential circuits:</strong> Output depends on inputs AND previous state — they have memory (flip-flops, registers, counters)</li>
<li><strong>Functional units:</strong> ALUs, memory arrays, bus controllers</li>
<li><strong>Processors:</strong> Complete CPUs that execute instructions</li>
</ol>
<p>We'll build all of these throughout this course. But first, we need a way to actually implement and test these circuits without soldering billions of transistors together. That's where FPGAs come in.</p>
` },
        { type: 'video', id: 'IcrBqCFLHIY', title: 'How Does a Transistor Work? (Veritasium)' },
        { type: 'video', id: 'J4oO7PT_nzQ', title: 'Transistors Explained — How Transistors Work (The Engineering Mindset)' },
        { type: 'video', id: 'AwRJsze_9m4', title: 'MOSFET Explained — How MOSFET Works (The Engineering Mindset)' },
        { type: 'video', id: 'sTu3LwpF6XI', title: 'Making Logic Gates from Transistors (Ben Eater)' },
        { type: 'video', id: 'gI-qXk7XojA', title: 'Boolean Logic & Logic Gates — Crash Course Computer Science #3' },
        { type: 'video', id: 'JQBRzsPhw2w', title: 'Logic Gates, Truth Tables, Boolean Algebra — AND, OR, NOT, NAND & NOR (Organic Chemistry Tutor)' },
        { type: 'video', id: 'QZwneRb-zqA', title: 'Exploring How Computers Work (Sebastian Lague)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Draw the CMOS circuit for a 2-input AND gate (hint: it\'s a NAND gate followed by an inverter)',
          'Write out the truth table for a 3-input NAND gate',
          'Use De Morgan\'s Laws to prove that !(A + B·C) = !A · (!B + !C)',
          'Design a circuit using only NAND gates that implements XOR (hint: you need 4 NAND gates)',
          'Calculate: how many transistors does a 2-input NAND gate need? What about an XOR built from NANDs?',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'ROHM: What is a Transistor?', url: 'https://www.rohm.com/electronics-basics/transistors/tr_what1', desc: 'Clear introduction to transistor fundamentals' },
          { type: 'Tutorial', title: 'SparkFun: Transistors', url: 'https://learn.sparkfun.com/tutorials/transistors', desc: 'Hands-on tutorial with practical examples' },
          { type: 'Article', title: 'All About Circuits: Boolean Algebra', url: 'https://www.allaboutcircuits.com/textbook/digital/chpt-7/introduction-boolean-algebra/', desc: 'Comprehensive Boolean algebra reference' },
          { type: 'Article', title: 'GeeksforGeeks: Boolean Algebra Basics', url: 'https://www.geeksforgeeks.org/digital-logic/basics-of-boolean-algebra-in-digital-electronics/', desc: 'Boolean algebra fundamentals in digital electronics' },
          { type: 'Interactive', title: 'Logic.ly - Logic Gate Simulator', url: 'https://logic.ly/demo/', desc: 'Build and test logic circuits interactively in your browser' },
          { type: 'Video', title: 'Ben Eater: Logic Gates from Transistors', url: 'https://www.youtube.com/watch?v=sTu3LwpF6XI', desc: 'Building gates on a breadboard' },
          { type: 'Article', title: 'Build Electronic Circuits: How Transistors Work (BJT and MOSFET)', url: 'https://www.build-electronic-circuits.com/how-transistors-work/', desc: 'Simple visual explanation comparing BJT and MOSFET' },
        ]},
      ],
    },
    {
      id: 2,
      title: "FPGAs and Look-Up Tables",
      subtitle: "Programmable hardware that can become any circuit",
      duration: "45 min",
      content: [
        { type: 'text', html: `
<h2>What is an FPGA?</h2>
<p>An <strong>FPGA</strong> (Field-Programmable Gate Array) is a special kind of chip that can be <strong>reprogrammed</strong> to act like any digital circuit you want. Unlike a regular CPU that runs software instructions, an FPGA physically reconfigures its internal wiring to become the circuit you describe. It's like having a blank chip that you can turn into anything — a CPU, a GPU, a network controller, or even a custom design that doesn't exist anywhere else.</p>

<p>This is why FPGAs are perfect for our course: instead of fabricating custom silicon chips (which costs millions of dollars and takes months), we can program an FPGA to become our custom CPU in seconds.</p>

<h3>How FPGAs Work Inside</h3>
<p>An FPGA contains three main components:</p>
<ol>
<li><strong>Configurable Logic Blocks (CLBs):</strong> Small units that can implement any logic function. Each CLB contains Look-Up Tables (LUTs), flip-flops, and multiplexers.</li>
<li><strong>Routing Fabric:</strong> A programmable interconnect network that connects CLBs to each other. Think of it as a reconfigurable highway system between logic blocks.</li>
<li><strong>I/O Blocks (IOBs):</strong> Special blocks at the edges of the chip that connect internal logic to external pins (for connecting to the outside world).</li>
</ol>
`},
        { type: 'diagram', content: `
FPGA Internal Architecture (Simplified):

┌──────────────────────────────────────────┐
│  IOB   IOB   IOB   IOB   IOB   IOB      │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐    │
│ │ IO ││ IO ││ IO ││ IO ││ IO ││ IO │    │
│ └────┘└────┘└────┘└────┘└────┘└────┘    │
│                                          │
│  ┌─────┐  ═══  ┌─────┐  ═══  ┌─────┐   │
│  │ CLB │══╪════│ CLB │══╪════│ CLB │   │
│  │     │  ║    │     │  ║    │     │   │
│  │ LUT │  ║    │ LUT │  ║    │ LUT │   │
│  │ FF  │  ║    │ FF  │  ║    │ FF  │   │
│  └─────┘  ║    └─────┘  ║    └─────┘   │
│     ║     ║       ║     ║       ║       │
│  ═══╪═════╪═══════╪═════╪═══════╪═══   │
│     ║     ║       ║     ║       ║       │
│  ┌─────┐  ║    ┌─────┐  ║    ┌─────┐   │
│  │ CLB │══╪════│ CLB │══╪════│ CLB │   │
│  │     │  ║    │     │  ║    │     │   │
│  │ LUT │  ║    │ LUT │  ║    │ LUT │   │
│  │ FF  │  ║    │ FF  │  ║    │ FF  │   │
│  └─────┘  ║    └─────┘  ║    └─────┘   │
│                                          │
│  CLB = Configurable Logic Block          │
│  LUT = Look-Up Table                    │
│  FF  = Flip-Flop                        │
│  ═══ = Programmable Routing             │
└──────────────────────────────────────────┘` },
        { type: 'text', html: `
<h3>Look-Up Tables (LUTs): The Heart of the FPGA</h3>
<p>The most important component inside each CLB is the <strong>Look-Up Table (LUT)</strong>. A LUT is essentially a small memory that stores the truth table of any Boolean function. Instead of implementing logic with actual gates, a LUT just stores the answer for every possible input combination.</p>

<p>Here's the key insight: <strong>A k-input LUT can implement ANY Boolean function of k variables</strong>. Most modern FPGAs use 4-input or 6-input LUTs.</p>

<h4>How a 4-input LUT Works</h4>
<p>A 4-input LUT has:</p>
<ul>
<li>4 input lines (A, B, C, D)</li>
<li>16 memory cells (2^4 = 16 possible input combinations)</li>
<li>1 output</li>
</ul>
<p>The 4 inputs act as an address to select which memory cell's value appears at the output. To make the LUT implement a specific function, you just program the 16 memory cells with the desired truth table values.</p>
`},
        { type: 'diagram', content: `
4-Input LUT Implementing AND(A,B) OR (C AND D):

Inputs     Memory
A B C D    Address → Stored Value → Output
0 0 0 0      0    →      0
0 0 0 1      1    →      0
0 0 1 0      2    →      0
0 0 1 1      3    →      1       (C AND D = 1)
0 1 0 0      4    →      0
0 1 0 1      5    →      0
0 1 1 0      6    →      0
0 1 1 1      7    →      1       (C AND D = 1)
1 0 0 0      8    →      0
1 0 0 1      9    →      0
1 0 1 0     10    →      0
1 0 1 1     11    →      1       (C AND D = 1)
1 1 0 0     12    →      1       (A AND B = 1)
1 1 0 1     13    →      1       (A AND B = 1)
1 1 1 0     14    →      1       (A AND B = 1)
1 1 1 1     15    →      1       (both true)

The LUT stores: 0001000100011111 (16 bits)` },
        { type: 'text', html: `
<h3>Flip-Flops: Adding Memory</h3>
<p>Each CLB also contains <strong>flip-flops</strong> (FFs) — simple 1-bit memory elements. A flip-flop captures and holds a value on the rising edge of a clock signal. This is how FPGAs implement sequential logic (circuits that have state/memory).</p>

<p>The combination of LUTs and flip-flops means each CLB can implement both:</p>
<ul>
<li><strong>Combinational logic:</strong> Output = function(inputs) — instant, no memory</li>
<li><strong>Sequential logic:</strong> Output = function(inputs, previous_state) — with memory, clocked</li>
</ul>

<h3>The FPGA Design Flow</h3>
<ol>
<li><strong>Write HDL code</strong> (Verilog or VHDL) describing your desired circuit</li>
<li><strong>Synthesis:</strong> Tools convert your HDL into a netlist of LUTs, FFs, and connections</li>
<li><strong>Place and Route:</strong> Tools map the netlist to specific physical CLBs and routing channels</li>
<li><strong>Bitstream generation:</strong> A binary configuration file is created</li>
<li><strong>Programming:</strong> The bitstream is loaded into the FPGA (via JTAG or flash), configuring all LUTs, FFs, and routing</li>
</ol>

<h3>FPGA vs ASIC vs CPU</h3>
`},
        { type: 'table', headers: ['Feature', 'FPGA', 'ASIC', 'CPU'],
          rows: [
            ['Reconfigurable?', 'Yes — reprogram anytime', 'No — fixed at fabrication', 'No — but runs different software'],
            ['Speed', 'Medium (100-500 MHz)', 'Fastest (GHz+)', 'Fast (GHz)'],
            ['Cost per unit', 'Medium ($5-$1000+)', 'Low at volume', 'Low at volume'],
            ['Development cost', 'Low ($0-$10k)', 'Very high ($1M+)', 'N/A (use existing CPUs)'],
            ['Power efficiency', 'Medium', 'Best', 'Worst for custom logic'],
            ['Best for', 'Prototyping, custom logic, low volume', 'High volume production', 'General purpose computing'],
          ]
        },
        { type: 'info', variant: 'info', title: 'Why We Use FPGAs for This Course',
          html: '<p>FPGAs let us design and test real hardware without the expense and delay of manufacturing custom chips. We can iterate on our CPU design in minutes instead of months. And since FPGAs implement actual parallel hardware (not software simulation), our designs will behave exactly like real chips — just at somewhat lower clock speeds.</p>' },
        { type: 'video', id: 'iHg0mmIg0UU', title: 'What is an FPGA? (Nandland)' },
        { type: 'video', id: 'lLg1AgA2Xoo', title: 'Introduction to FPGA Part 1 — What is an FPGA? (DigiKey / Shawn Hymel)' },
        { type: 'video', id: 'l3d8uFKsJiY', title: 'The Harsh Truth about FPGAs — You Should Avoid Them?! (GreatScott!)' },
        { type: 'video', id: 'd86ws7mQYIg', title: 'How does Computer Hardware Work? — 3D Animated Teardown (Branch Education)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Write out the 16-bit LUT contents for a 4-input XOR function (A XOR B XOR C XOR D)',
          'Calculate how many LUTs would be needed to implement an 8-bit adder (hint: each bit needs a sum and carry)',
          'Research and list the specifications of 3 popular FPGA boards under $100 (number of LUTs, flip-flops, block RAM)',
          'Explain why a 6-input LUT is more efficient than a 4-input LUT for complex functions, but uses more memory',
          'Draw a diagram showing how a D flip-flop works with a clock signal',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Nandland: FPGA 101', url: 'https://nandland.com/lesson-1-what-is-an-fpga/', desc: 'Excellent beginner-friendly FPGA introduction' },
          { type: 'Article', title: 'Nandland: What is a Look-Up Table (LUT)?', url: 'https://nandland.com/lesson-4-what-is-a-look-up-table-lut/', desc: 'Detailed explanation of LUTs with examples' },
          { type: 'Article', title: 'All About Circuits: FPGA Look-Up Tables', url: 'https://www.allaboutcircuits.com/technical-articles/purpose-and-internal-functionality-of-fpga-look-up-tables/', desc: 'Deep dive into FPGA LUT architecture' },
          { type: 'Tutorial', title: 'SparkFun: How Does an FPGA Work?', url: 'https://learn.sparkfun.com/tutorials/how-does-an-fpga-work/all', desc: 'Visual walkthrough of FPGA internals (LUTs, CLBs, routing)' },
          { type: 'Article', title: 'FPGA Insights: Overview of LUTs in FPGA Design', url: 'https://fpgainsights.com/fpga/overview-of-lookup-tables-lut-in-fpga-design/', desc: 'Detailed LUT guide with SRAM cell and multiplexer explanations' },
          { type: 'Article', title: 'SparkFun: Integrated Circuits', url: 'https://learn.sparkfun.com/tutorials/integrated-circuits/all', desc: 'Overview of ICs — from transistors to packaged chips' },
          { type: 'Video Series', title: 'DigiKey: Introduction to FPGA (12-part playlist)', url: 'https://www.youtube.com/watch?v=lLg1AgA2Xoo&list=PLEBQazB0HUyT1WmMONxRZn9NmQ_9CIKhb', desc: 'Comprehensive FPGA course from DigiKey with Shawn Hymel' },
          { type: 'Code', title: 'DigiKey FPGA Tutorial Code (GitHub)', url: 'https://github.com/ShawnHymel/introduction-to-fpga', desc: 'Example code for the DigiKey FPGA tutorial series' },
        ]},
      ],
    },
    {
      id: 3,
      title: "Verilator: Simulating Hardware in Software",
      subtitle: "Test your designs without a physical FPGA",
      duration: "1 hour",
      content: [
        { type: 'text', html: `
<h2>Why Simulate?</h2>
<p>Before we start writing hardware designs, we need a way to test them. Buying an FPGA board is optional — <strong>Verilator</strong> lets us simulate our Verilog designs on a regular computer, running them as fast C++ programs.</p>

<p>Verilator is a <strong>Verilog simulator</strong> — arguably the fastest free one available. Unlike traditional simulators that interpret HDL code step by step, Verilator <strong>compiles</strong> your Verilog into optimized C++ code, which you then compile with gcc/g++ and run as a native executable. This makes it orders of magnitude faster than interpreted simulators.</p>

<h3>How Verilator Works</h3>
`},
        { type: 'diagram', content: `
The Verilator Flow:

┌──────────────┐     ┌────────────┐     ┌──────────────┐
│  Your Verilog │     │            │     │  C++ Model   │
│  Design       │────→│  Verilator │────→│  (.cpp/.h)   │
│  (.v files)   │     │            │     │              │
└──────────────┘     └────────────┘     └──────┬───────┘
                                               │
┌──────────────┐                               │
│  Your C++    │                               │
│  Testbench   │───────────────────────────────┤
│  (main.cpp)  │                               │
└──────────────┘                               │
                                               ▼
                                        ┌──────────────┐
                                        │  g++ / clang │
                                        │  Compile     │
                                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Executable  │
                                        │  (simulate!) │
                                        └──────────────┘` },
        { type: 'text', html: `
<h3>Installing Verilator</h3>
<p>Installation depends on your OS:</p>
`},
        { type: 'code', label: 'macOS (Homebrew)', code: `brew install verilator` },
        { type: 'code', label: 'Ubuntu/Debian', code: `sudo apt-get install verilator
# For the latest version, build from source:
git clone https://github.com/verilator/verilator
cd verilator
autoconf
./configure
make -j$(nproc)
sudo make install` },
        { type: 'text', html: `
<h3>Your First Verilator Simulation</h3>
<p>Let's create a simple AND gate in Verilog and simulate it. This will be our "Hello World" for hardware design.</p>
<h4>Step 1: Write the Verilog module</h4>
`},
        { type: 'code', label: 'and_gate.v', code: `// A simple 2-input AND gate
module and_gate (
    input  wire a,      // First input
    input  wire b,      // Second input
    output wire y       // Output: a AND b
);
    assign y = a & b;   // Continuous assignment: y is always a AND b
endmodule` },
        { type: 'text', html: `<h4>Step 2: Write a C++ testbench</h4>` },
        { type: 'code', label: 'tb_and_gate.cpp', code: `#include <stdio.h>
#include <stdlib.h>
#include "Vand_gate.h"       // Verilator generates this from and_gate.v
#include "verilated.h"

int main(int argc, char **argv) {
    Verilated::commandArgs(argc, argv);

    // Instantiate our module
    Vand_gate *dut = new Vand_gate;  // "DUT" = Device Under Test

    // Test all input combinations
    printf("A | B | Y\\n");
    printf("--+---+--\\n");

    for (int a = 0; a <= 1; a++) {
        for (int b = 0; b <= 1; b++) {
            dut->a = a;
            dut->b = b;
            dut->eval();     // Evaluate the circuit
            printf("%d | %d | %d\\n", dut->a, dut->b, dut->y);
        }
    }

    delete dut;
    return 0;
}` },
        { type: 'text', html: `<h4>Step 3: Build and run</h4>` },
        { type: 'code', label: 'Terminal commands', code: `# Generate C++ from Verilog
verilator --cc and_gate.v --exe tb_and_gate.cpp

# Build the simulation
make -C obj_dir -f Vand_gate.mk Vand_gate

# Run it!
./obj_dir/Vand_gate` },
        { type: 'text', html: `<h4>Expected output:</h4>` },
        { type: 'code', code: `A | B | Y
--+---+--
0 | 0 | 0
0 | 1 | 0
1 | 0 | 0
1 | 1 | 1` },
        { type: 'text', html: `
<h3>Adding Waveform Tracing</h3>
<p>One of the most powerful debugging features in hardware simulation is <strong>waveform viewing</strong>. Verilator can generate VCD (Value Change Dump) files that you can view in GTKWave — a free waveform viewer that shows how all signals change over time.</p>
`},
        { type: 'code', label: 'tb_with_trace.cpp — Adding VCD trace support', code: `#include <stdio.h>
#include "Vand_gate.h"
#include "verilated.h"
#include "verilated_vcd_c.h"   // Include VCD tracing support

int main(int argc, char **argv) {
    Verilated::commandArgs(argc, argv);
    Verilated::traceEverOn(true);  // Enable tracing

    Vand_gate *dut = new Vand_gate;
    VerilatedVcdC *trace = new VerilatedVcdC;
    dut->trace(trace, 5);          // Trace 5 levels of hierarchy
    trace->open("waveform.vcd");   // Output file

    int sim_time = 0;
    for (int a = 0; a <= 1; a++) {
        for (int b = 0; b <= 1; b++) {
            dut->a = a;
            dut->b = b;
            dut->eval();
            trace->dump(sim_time);  // Record signals at this time
            sim_time += 10;         // Advance time by 10 units
        }
    }

    trace->close();
    delete dut;
    return 0;
}` },
        { type: 'code', label: 'Build with tracing enabled', code: `verilator --cc and_gate.v --exe tb_with_trace.cpp --trace
make -C obj_dir -f Vand_gate.mk Vand_gate
./obj_dir/Vand_gate
gtkwave waveform.vcd   # Open waveform viewer` },
        { type: 'info', variant: 'success', title: 'GTKWave',
          html: '<p>Install GTKWave with <code>brew install --cask gtkwave</code> (macOS) or <code>sudo apt install gtkwave</code> (Linux). It lets you visually inspect every signal in your design over time — essential for debugging hardware.</p>' },

        { type: 'video', id: 'KMpFn-FQrTg', title: 'Verilator Introduction Tutorial' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Create a Verilog XOR gate and simulate it with Verilator — verify all 4 input combinations',
          'Build a 4-bit adder in Verilog and write a testbench that tests at least 10 different addition operations',
          'Create a 2-to-1 multiplexer (output = sel ? b : a) and simulate it',
          'Add VCD tracing to your adder testbench and view the waveforms in GTKWave',
          'Build a simple 4-bit counter that increments every clock cycle and simulate 20 clock cycles',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: "Verilator Pt.1: Introduction — It's Embedded!", url: 'https://itsembedded.com/dhd/verilator_1/', desc: 'The best beginner Verilator tutorial' },
          { type: 'Documentation', title: 'Verilator Official Manual', url: 'https://verilator.org/guide/latest/', desc: 'Comprehensive reference documentation' },
          { type: 'Tutorial', title: 'ZipCPU: Getting Started with Verilator', url: 'https://zipcpu.com/blog/2017/06/21/looking-at-verilator.html', desc: 'Practical tips from an experienced FPGA developer' },
          { type: 'Tool', title: 'GTKWave Waveform Viewer', url: 'https://gtkwave.sourceforge.net/', desc: 'Free waveform viewer for VCD files' },
        ]},
      ],
    },
  ],
}
