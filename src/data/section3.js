export const section3 = {
  id: 3,
  title: "Processor Design",
  subtitle: "CPU Architecture, ARM Assembly, Assemblers, and Verilog CPU",
  duration: "3 weeks",
  description: "Design a CPU from scratch: understand the fetch-decode-execute cycle, learn ARM assembly, write an assembler in Python, build a complete CPU in Verilog, and implement a bootloader.",
  longDescription: "This section takes you from understanding what a CPU does to actually building one. You will learn how the fetch-decode-execute cycle works, study the ARM instruction set architecture, write ARM assembly programs, build your own assembler in Python that converts assembly to machine code, design every component of a CPU in Verilog (program counter, decoder, register file, ALU, memory interface, control unit), add pipelining, and finally build a boot ROM and serial bootloader so your CPU can load programs over UART.",
  topics: ["Fetch-Decode-Execute", "ARM Architecture", "ARM Assembly", "Assembler", "Verilog CPU", "ALU", "Pipelining", "Bootloader"],
  learningGoals: [
    "Explain the fetch-decode-execute cycle and trace instructions through it",
    "Describe the ARMv7 register set, instruction formats, and encoding",
    "Write ARM assembly programs using MOV, ADD, SUB, LDR, STR, B, BL, CMP",
    "Build a two-pass assembler in Python that encodes ARM instructions to binary",
    "Design and simulate each CPU component in Verilog: PC, decoder, register file, ALU, memory, control unit",
    "Understand pipeline stages, hazards, and forwarding",
    "Implement a boot ROM and serial bootloader"
  ],
  lessons: [
    {
      id: 1,
      title: "What is a CPU? The Fetch-Decode-Execute Cycle",
      subtitle: "The fundamental heartbeat of every processor",
      duration: "60 min",
      content: [
        { type: 'text', html: `
<h2>What is a CPU?</h2>
<p>A Central Processing Unit (CPU) is the electronic circuitry that executes instructions comprising a computer program. At the lowest level, a CPU does only three things over and over, billions of times per second: <strong>fetch</strong> an instruction from memory, <strong>decode</strong> that instruction to figure out what it means, and <strong>execute</strong> the operation it specifies.</p>

<h3>Why Does a CPU Exist?</h3>
<p>Without a CPU, you would need a separate circuit for every computation. A CPU replaces all of those circuits with a single, programmable engine that reads a list of instructions (a program) from memory and carries them out one at a time. This is the <strong>stored-program concept</strong>, credited to John von Neumann.</p>

<h3>The Fetch-Decode-Execute Cycle</h3>
<p>This is the heartbeat of every processor ever built.</p>

<h4>Stage 1: Fetch</h4>
<p>The CPU maintains a special register called the <strong>Program Counter (PC)</strong>, which holds the memory address of the next instruction to execute. During the fetch stage:</p>
<ol>
<li>The PC's value is copied into the <strong>Memory Address Register (MAR)</strong>.</li>
<li>The CPU sends that address to main memory over the address bus.</li>
<li>Memory returns the instruction stored at that address over the data bus.</li>
<li>The instruction is placed into the <strong>Memory Data Register (MDR)</strong>, then copied into the <strong>Current Instruction Register (CIR)</strong>.</li>
<li>The PC is incremented (PC = PC + instruction_size) so it points to the next instruction.</li>
</ol>

<h4>Stage 2: Decode</h4>
<p>The <strong>Control Unit (CU)</strong> examines the binary instruction in the CIR and splits it into its component parts:</p>
<ul>
<li><strong>Opcode</strong>: Which operation to perform (add, subtract, load, store, branch, etc.)</li>
<li><strong>Operands</strong>: What data to operate on (register numbers, immediate values, memory addresses)</li>
</ul>
<p>The CU then generates the appropriate internal control signals. For example, if the opcode says "ADD," the CU signals the ALU to perform addition, opens the correct register ports, and prepares to write the result back.</p>

<h4>Stage 3: Execute</h4>
<p>The relevant functional unit carries out the decoded operation:</p>
<ul>
<li><strong>Arithmetic/Logic</strong>: The ALU performs the calculation (e.g., R0 = R1 + R2).</li>
<li><strong>Memory Access</strong>: Data is loaded from or stored to memory.</li>
<li><strong>Branching</strong>: The PC is overwritten with a new address, causing execution to jump.</li>
<li><strong>Comparison</strong>: Two values are compared and CPU flags (Zero, Negative, Carry, Overflow) are set.</li>
</ul>
<p>Once execution completes, the cycle returns to Fetch and repeats.</p>
` },
        { type: 'table', headers: ['Register', 'Full Name', 'Purpose'],
          rows: [
            ['PC', 'Program Counter', 'Address of the next instruction'],
            ['MAR', 'Memory Address Register', 'Holds the address being read/written'],
            ['MDR', 'Memory Data Register', 'Holds the data read from or written to memory'],
            ['CIR', 'Current Instruction Register', 'Holds the instruction currently being decoded/executed'],
            ['ACC', 'Accumulator', 'Stores intermediate arithmetic results'],
          ]
        },
        { type: 'text', html: `
<h3>A Concrete Example</h3>
<p>Suppose memory contains these instructions starting at address 0x00:</p>
` },
        { type: 'code', label: 'Simple program', code: `0x00: LOAD R1, #5      ; Put the value 5 into register R1
0x04: LOAD R2, #3      ; Put the value 3 into register R2
0x08: ADD  R0, R1, R2  ; R0 = R1 + R2 = 8
0x0C: STORE R0, [0x20] ; Write R0 to memory address 0x20` },
        { type: 'text', html: `
<p><strong>Cycle 1 (LOAD R1, #5):</strong> Fetch: PC=0x00, read instruction, PC becomes 0x04. Decode: opcode=LOAD, dest=R1, value=5. Execute: write 5 into R1.</p>
<p><strong>Cycle 2 (LOAD R2, #3):</strong> Fetch: PC=0x04, read instruction, PC becomes 0x08. Decode: opcode=LOAD, dest=R2, value=3. Execute: write 3 into R2.</p>
<p><strong>Cycle 3 (ADD R0, R1, R2):</strong> Fetch: PC=0x08, read instruction, PC becomes 0x0C. Decode: opcode=ADD, dest=R0, src1=R1, src2=R2. Execute: ALU computes 5+3=8, writes 8 into R0.</p>
<p><strong>Cycle 4 (STORE R0, [0x20]):</strong> Fetch: PC=0x0C, read instruction, PC becomes 0x10. Decode: opcode=STORE, src=R0, addr=0x20. Execute: write 8 to memory address 0x20.</p>

<h3>Von Neumann vs Harvard Architecture</h3>
<p>In a <strong>von Neumann architecture</strong>, instructions and data share the same memory and bus. In a <strong>Harvard architecture</strong>, they have separate memories and buses. Most modern CPUs use a modified Harvard architecture internally (separate instruction and data caches) with a unified main memory.</p>
` },
        { type: 'info', variant: 'tip', title: 'Everything Builds on This',
          html: '<p>Every optimization in modern CPUs — pipelining, out-of-order execution, branch prediction, superscalar execution — is built on top of this fundamental cycle. You cannot understand any advanced CPU concept without first internalizing fetch-decode-execute.</p>' },

        { type: 'video', id: 'FZGugFqdr60', title: 'The Central Processing Unit (CPU) — Crash Course Computer Science #7' },
        { type: 'video', id: 'Z5JC9Ve1sfI', title: 'How a CPU Works (In One Lesson)' },
        { type: 'video', id: 'jFDMZpkUWCw', title: 'Understanding the Fetch Decode Execute Cycle' },
        { type: 'video', id: '1I5ZMmrOfnA', title: 'How Computers Calculate — the ALU: Crash Course CS #5' },
        { type: 'video', id: 'QZwneRb-zqA', title: 'Exploring How Computers Work (Sebastian Lague)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Draw a diagram showing the fetch-decode-execute cycle with all registers (PC, MAR, MDR, CIR, ACC) and label each data flow with numbered steps.',
          'Trace through a 6-instruction program by hand: for each instruction, write down the values of PC, MAR, MDR, CIR, and all general-purpose registers after fetch, after decode, and after execute.',
          'Explain why the PC must be incremented during the fetch stage rather than during the execute stage. What would go wrong if it were incremented at the wrong time?',
          'Consider a branch instruction (e.g., JUMP 0x00). Explain what happens to the PC during the execute stage and why this causes a loop.',
          'Research: What is the difference between a von Neumann architecture and a Harvard architecture? Draw block diagrams of both and explain the tradeoffs.',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'Instruction Cycle — Wikipedia', url: 'https://en.wikipedia.org/wiki/Instruction_cycle', desc: 'Comprehensive reference on the instruction cycle' },
          { type: 'Article', title: 'Introduction to the Fetch-Execute Cycle — Baeldung', url: 'https://www.baeldung.com/cs/fetch-execute-cycle', desc: 'Clear walkthrough with diagrams' },
          { type: 'Article', title: 'The Fetch-Decode-Execute Cycle — Ada Computer Science', url: 'https://adacomputerscience.org/concepts/arch_fe_cycle', desc: 'Interactive educational resource' },
          { type: 'Book', title: 'Bottom Up Computer Science — Chapter 3', url: 'https://www.bottomupcs.com/ch03.html', desc: 'Free online textbook covering architecture' },
          { type: 'Article', title: 'Understanding the Instruction Cycle — Codecademy', url: 'https://www.codecademy.com/article/the-instruction-cycle', desc: 'Beginner-friendly explanation' },
        ]},
      ],
    },
    {
      id: 2,
      title: "ARM Architecture Overview",
      subtitle: "Registers, instruction formats, and the RISC philosophy",
      duration: "75 min",
      content: [
        { type: 'text', html: `
<h2>ARM Architecture Overview</h2>
<p>ARM (Advanced RISC Machines) is the most widely deployed processor architecture in the world, present in over 200 billion devices. Understanding ARM is essential because it exemplifies clean RISC design principles and is the dominant architecture in embedded systems, mobile phones, and increasingly in laptops and servers.</p>

<h3>The RISC Philosophy</h3>
<p>ARM processors follow the <strong>RISC (Reduced Instruction Set Computer)</strong> philosophy:</p>
<ul>
<li>All instructions are the same size (32 bits in ARM mode)</li>
<li>Most instructions execute in a single clock cycle</li>
<li>Only LOAD and STORE instructions access memory (load/store architecture)</li>
<li>A large, uniform register file simplifies programming</li>
</ul>
<p>This contrasts with CISC architectures (like x86) where instructions vary in length and complexity.</p>

<h3>ARMv7 Architecture</h3>
<p>ARMv7 is the last major 32-bit ARM architecture, widely used in education and embedded systems (Raspberry Pi 2, many STM32 microcontrollers). It defines three profiles:</p>
<ul>
<li><strong>ARMv7-A</strong> (Application): Full-featured with virtual memory (Cortex-A series)</li>
<li><strong>ARMv7-R</strong> (Real-time): For safety-critical real-time systems (Cortex-R series)</li>
<li><strong>ARMv7-M</strong> (Microcontroller): Simplified for embedded use (Cortex-M series)</li>
</ul>
` },
        { type: 'text', html: '<h3>Registers</h3><p>ARMv7 provides <strong>16 general-purpose 32-bit registers</strong>:</p>' },
        { type: 'table', headers: ['Register', 'Alias', 'Purpose'],
          rows: [
            ['R0-R3', 'a1-a4', 'Function arguments and return values'],
            ['R4-R11', 'v1-v8', 'Variable registers (callee-saved)'],
            ['R12', 'IP', 'Intra-procedure scratch register'],
            ['R13', 'SP', 'Stack Pointer'],
            ['R14', 'LR', 'Link Register (return address for function calls)'],
            ['R15', 'PC', 'Program Counter'],
          ]
        },
        { type: 'info', variant: 'warning', title: 'PC Quirk',
          html: '<p>R15 (PC) reads as the current instruction address + 8 in ARM mode. This is a legacy from the original ARM1 three-stage pipeline: by the time an instruction executes, the fetch stage has already moved two instructions ahead.</p>' },
        { type: 'text', html: `
<h4>Current Program Status Register (CPSR)</h4>
<p>The CPSR contains:</p>
<ul>
<li><strong>Condition flags</strong> (bits 31-28): N (Negative), Z (Zero), C (Carry), V (Overflow)</li>
<li><strong>Control bits</strong>: Interrupt disable flags, processor mode, Thumb state bit</li>
</ul>
<p>The condition flags are critical because ARM's defining feature is <strong>conditional execution</strong> — nearly every instruction can be made conditional by adding a suffix (EQ, NE, GT, LT, etc.).</p>

<h3>Instruction Formats</h3>
<p>Every ARM instruction is exactly 32 bits wide. The bits are divided into fields:</p>

<h4>Data Processing Instructions (ADD, SUB, MOV, CMP, etc.)</h4>
` },
        { type: 'diagram', content: `ARM Data Processing Instruction Encoding (32 bits):

 31-28   27-26   25    24-21   20    19-16   15-12   11-0
[cond]  [ 00 ]  [I]   [opcd]  [S]   [ Rn ]  [ Rd ]  [operand2]
  |        |      |      |      |      |       |        |
  |        |      |      |      |      |       |        +-- Second operand
  |        |      |      |      |      |       +----------- Destination register
  |        |      |      |      |      +------------------- First source register
  |        |      |      |      +-------------------------- Set flags? (S suffix)
  |        |      |      +--------------------------------- ALU operation
  |        |      +---------------------------------------- 1=immediate, 0=register
  |        +----------------------------------------------- Data processing class
  +-------------------------------------------------------- Condition code` },
        { type: 'text', html: `
<p>Key fields:</p>
<ul>
<li><strong>cond (4 bits)</strong>: Condition code — e.g., 1110 = Always (AL), 0000 = Equal (EQ)</li>
<li><strong>I bit</strong>: If 1, operand2 is an immediate; if 0, it is a register</li>
<li><strong>opcode (4 bits)</strong>: Operation — 0100=ADD, 0010=SUB, 1101=MOV, 1010=CMP</li>
<li><strong>S bit</strong>: If 1, update the CPSR condition flags</li>
<li><strong>Rn (4 bits)</strong>: First source register</li>
<li><strong>Rd (4 bits)</strong>: Destination register</li>
<li><strong>operand2 (12 bits)</strong>: Second operand — register with optional shift, or 8-bit immediate with 4-bit rotation</li>
</ul>

<h4>Immediate Value Encoding</h4>
<p>ARM encodes immediates as an 8-bit value rotated right by twice a 4-bit rotation amount: <code>immediate = imm8 ROR (2 * rot4)</code>. Not every 32-bit constant can be encoded — only those expressible as a rotated 8-bit value.</p>

<h4>Branch Instructions</h4>
` },
        { type: 'diagram', content: `ARM Branch Instruction Encoding (32 bits):

 31-28   27-25   24      23-0
[cond]  [101]   [L]    [offset]
  |       |       |        |
  |       |       |        +-- 24-bit signed offset (shifted left 2 = +/- 32MB range)
  |       |       +----------- Link bit: 1 = BL (save return addr in LR)
  |       +------------------- Branch instruction class
  +--------------------------- Condition code` },
        { type: 'text', html: `
<h3>Processor Modes</h3>
<p>ARM has several operating modes for privilege separation:</p>
<ul>
<li><strong>User</strong>: Normal program execution (unprivileged)</li>
<li><strong>FIQ/IRQ</strong>: Fast/normal interrupt handling</li>
<li><strong>Supervisor</strong>: Entered on reset or SVC instruction (OS kernel)</li>
<li><strong>Abort</strong>: Memory access faults</li>
<li><strong>Undefined</strong>: Undefined instruction traps</li>
</ul>
<p>Each mode (except User and System) has its own banked copies of SP and LR, enabling fast context switching during interrupts.</p>

<h3>Thumb Mode</h3>
<p>ARM also supports <strong>Thumb</strong> (16-bit) instructions for code density. Thumb-2 (in ARMv7) allows a mix of 16-bit and 32-bit instructions, getting close to ARM performance with significantly smaller code size.</p>
` },
        { type: 'video', id: 'gfmRrPjnEw4', title: 'Assembly Language Programming with ARM — Full Tutorial (freeCodeCamp)' },
        { type: 'video', id: 'FZGugFqdr60', title: 'The Central Processing Unit — Crash Course CS #7' },
        { type: 'video', id: 'rtAlC5J1U40', title: 'Advanced CPU Designs — Crash Course CS #9' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'List all 16 ARM registers and explain the special role of R13, R14, and R15. Why does reading R15 give you the current instruction address plus 8?',
          'Given the ARM data processing instruction encoding, manually encode "ADD R0, R1, #42" into its 32-bit binary representation. Show each field.',
          'Explain why ARM uses a "rotated 8-bit immediate" scheme. What values CAN be represented? Give three examples of valid immediates and three invalid ones.',
          'Compare the ARM (RISC) approach to instruction encoding with x86 (CISC). Why does ARM use fixed-width 32-bit instructions while x86 uses variable-length instructions from 1 to 15 bytes?',
          'Draw a diagram showing how the ARM register bank is organized with banked registers for different processor modes.',
        ]},
        { type: 'resources', links: [
          { type: 'Reference', title: 'ARM Architecture Family — Wikipedia', url: 'https://en.wikipedia.org/wiki/ARM_architecture_family', desc: 'Comprehensive ARM architecture overview' },
          { type: 'Reference', title: 'ARMv7-M Architecture Reference Manual', url: 'https://developer.arm.com/documentation/ddi0403/latest/', desc: 'Official ARM architecture specification' },
          { type: 'Article', title: 'ARM Instruction Set — IIT Delhi Reference', url: 'https://iitd-plos.github.io/col718/ref/arm-instructionset.pdf', desc: 'Complete ARM7TDMI instruction set reference (PDF)' },
          { type: 'Article', title: 'ARM Immediate Value Encoding', url: 'https://alisdair.mcdiarmid.org/arm-immediate-value-encoding/', desc: 'Excellent explanation of the rotated immediate scheme' },
          { type: 'Article', title: 'ARM Instruction Set Encoding — ARM Developer', url: 'https://developer.arm.com/documentation/ddi0406/c/Application-Level-Architecture/ARM-Instruction-Set-Encoding/ARM-instruction-set-encoding', desc: 'Official encoding reference' },
        ]},
      ],
    },
    {
      id: 3,
      title: "ARM Assembly Language Tutorial",
      subtitle: "Hands-on with MOV, ADD, SUB, LDR, STR, B, BL, CMP",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>ARM Assembly Language Tutorial</h2>
<p>This lesson teaches you to read and write ARM assembly. We cover the most important instructions, working through each one from first principles.</p>

<h3>Setting Up Your Environment</h3>
<p>You can practice ARM assembly several ways:</p>
<ul>
<li><strong>QEMU User Mode</strong>: Emulate ARM on x86 Linux — <code>sudo apt install qemu-user gcc-arm-linux-gnueabihf</code></li>
<li><strong>Raspberry Pi</strong>: Native ARM hardware</li>
<li><strong>CPUlator</strong>: Browser-based ARM simulator — <a href="https://cpulator.01xz.net/?sys=arm" target="_blank">cpulator.01xz.net</a></li>
<li><strong>VisUAL</strong>: Visual ARM simulator for education</li>
</ul>

<h3>Data Processing Instructions</h3>

<h4>MOV — Move</h4>
<p>Copies a value into a register. Does NOT read from memory.</p>
` },
        { type: 'code', label: 'MOV examples', code: `MOV R0, #42        @ R0 = 42 (immediate value)
MOV R1, R0         @ R1 = R0 (register to register)
MOV R2, R1, LSL #2 @ R2 = R1 << 2 (shifted register)` },
        { type: 'text', html: `
<p>The barrel shifter is one of ARM's signature features. The second operand can be shifted before the operation at no extra cost: <strong>LSL</strong> (shift left), <strong>LSR</strong> (logical shift right), <strong>ASR</strong> (arithmetic shift right), <strong>ROR</strong> (rotate right).</p>

<h4>ADD — Add</h4>
` },
        { type: 'code', label: 'ADD examples', code: `ADD R0, R1, R2      @ R0 = R1 + R2
ADD R0, R1, #10     @ R0 = R1 + 10
ADDS R0, R1, R2     @ R0 = R1 + R2, and update CPSR flags` },
        { type: 'text', html: `<p>The <code>S</code> suffix makes the instruction update the condition flags (N, Z, C, V). Without it, flags are untouched.</p>
<h4>SUB — Subtract</h4>` },
        { type: 'code', label: 'SUB examples', code: `SUB R0, R1, R2      @ R0 = R1 - R2
SUB R0, R1, #1      @ R0 = R1 - 1
SUBS R0, R0, #1     @ R0 = R0 - 1, update flags (useful for loops)
RSB R0, R1, #0      @ R0 = 0 - R1 (Reverse Subtract = negate)` },
        { type: 'text', html: `
<h3>Memory Access Instructions</h3>
<p>ARM is a <strong>load/store architecture</strong>: you cannot perform arithmetic directly on memory. You must first load data into a register, operate on it, then store it back.</p>
<h4>LDR — Load Register</h4>` },
        { type: 'code', label: 'LDR examples', code: `LDR R0, [R1]        @ R0 = Memory[R1]         (base register)
LDR R0, [R1, #4]    @ R0 = Memory[R1 + 4]     (immediate offset)
LDR R0, [R1, R2]    @ R0 = Memory[R1 + R2]    (register offset)
LDR R0, [R1, #4]!   @ R1 += 4, then R0 = Memory[R1]  (pre-indexed writeback)
LDR R0, [R1], #4    @ R0 = Memory[R1], then R1 += 4   (post-indexed)` },
        { type: 'text', html: '<h4>STR — Store Register</h4>' },
        { type: 'code', label: 'STR examples', code: `STR R0, [R1]        @ Memory[R1] = R0
STR R0, [R1, #8]    @ Memory[R1 + 8] = R0
STR R0, [R1, #4]!   @ R1 += 4, then Memory[R1] = R0` },
        { type: 'text', html: `
<h3>Comparison and Conditional Execution</h3>
<h4>CMP — Compare</h4>
<p>CMP subtracts the second operand from the first and sets flags, but discards the result:</p>` },
        { type: 'code', label: 'CMP examples', code: `CMP R0, #10         @ Compute R0 - 10, set flags, discard result
CMP R0, R1          @ Compute R0 - R1, set flags, discard result` },
        { type: 'text', html: '<h4>Condition Codes</h4><p>After CMP (or any S-suffixed instruction), you can conditionally execute subsequent instructions:</p>' },
        { type: 'table', headers: ['Suffix', 'Meaning', 'Flags Tested'],
          rows: [
            ['EQ', 'Equal', 'Z=1'],
            ['NE', 'Not Equal', 'Z=0'],
            ['GT', 'Greater Than (signed)', 'Z=0 and N=V'],
            ['LT', 'Less Than (signed)', 'N!=V'],
            ['GE', 'Greater or Equal (signed)', 'N=V'],
            ['LE', 'Less or Equal (signed)', 'Z=1 or N!=V'],
            ['HI', 'Higher (unsigned >)', 'C=1 and Z=0'],
            ['LO/CC', 'Lower (unsigned <)', 'C=0'],
          ]
        },
        { type: 'code', label: 'Conditional execution', code: `CMP R0, #0
MOVEQ R1, #1       @ If R0 == 0, set R1 = 1
MOVNE R1, #0       @ If R0 != 0, set R1 = 0` },
        { type: 'info', variant: 'tip', title: 'ARM Conditional Execution',
          html: '<p>This is unique to ARM — almost <strong>every</strong> instruction can be conditionally executed, not just branches. This avoids branch penalty on short if/else sequences.</p>' },
        { type: 'text', html: `
<h3>Branch Instructions</h3>
<h4>B — Branch</h4>` },
        { type: 'code', label: 'Branch examples', code: `B label             @ Jump to label (unconditional)
BEQ label           @ Jump if equal (Z flag set)
BNE label           @ Jump if not equal (Z flag clear)
BGT label           @ Jump if greater than (signed)` },
        { type: 'text', html: '<h4>BL — Branch with Link</h4><p>BL saves the return address in the Link Register (LR/R14), enabling function calls:</p>' },
        { type: 'code', label: 'Function call with BL', code: `BL my_function      @ LR = address of next instruction, PC = my_function
@ ... execution continues here after function returns

my_function:
    @ function body here
    BX LR           @ Return: PC = LR` },
        { type: 'text', html: '<h3>Complete Example: Sum of Array</h3>' },
        { type: 'code', label: 'Sum of array in ARM assembly', code: `.global _start

_start:
    LDR R0, =array      @ R0 = base address of array
    MOV R1, #5           @ R1 = number of elements
    MOV R2, #0           @ R2 = running sum (accumulator)

sum_loop:
    LDR R3, [R0], #4    @ Load array[i] into R3, advance pointer by 4
    ADD R2, R2, R3       @ sum += array[i]
    SUBS R1, R1, #1      @ count--; update flags
    BNE sum_loop         @ if count != 0, keep looping

    @ R2 now contains the sum (150)
    MOV R7, #1           @ syscall number for exit
    MOV R0, R2           @ exit code = sum
    SWI #0               @ make syscall

.data
array:
    .word 10, 20, 30, 40, 50` },
        { type: 'text', html: '<h3>Stack Operations</h3><p>ARM uses PUSH and POP (aliases for STMDB and LDMIA with SP):</p>' },
        { type: 'code', label: 'Stack usage in functions', code: `my_function:
    PUSH {R4-R6, LR}    @ Save callee-saved registers and return address
    @ ... function body using R4, R5, R6 freely ...
    POP  {R4-R6, PC}    @ Restore registers and return (pop LR into PC)` },

        { type: 'video', id: 'gfmRrPjnEw4', title: 'Assembly Language Programming with ARM — Full Tutorial (freeCodeCamp)' },
        { type: 'video', id: 'Jz0k3uMpmxA', title: 'You Can Learn ARM Assembly in 15 Minutes' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Write an ARM assembly program that computes the factorial of a number stored in R0 (e.g., 5! = 120). Use a loop with SUBS and BNE.',
          'Write a function in ARM assembly that takes two arguments in R0 and R1, returns the larger value in R0. Use CMP, MOVGT/MOVLE, and BX LR.',
          'Write an ARM assembly program that reverses an array of 8 words in place using two pointers.',
          'Manually trace through the Sum of Array example: write down every register after each instruction for the first two iterations.',
          'Convert this C function to ARM assembly: int dot_product(int *a, int *b, int n) { int sum = 0; for (int i = 0; i < n; i++) sum += a[i] * b[i]; return sum; }',
          'Write a recursive Fibonacci function in ARM assembly using BL for calls and PUSH/POP to preserve registers.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Writing ARM Assembly Part 1 — Azeria Labs', url: 'https://azeria-labs.com/writing-arm-assembly-part-1/', desc: 'Excellent 7-part ARM assembly tutorial series' },
          { type: 'Tutorial', title: 'ARM Data Types and Registers (Part 2) — Azeria Labs', url: 'https://azeria-labs.com/arm-data-types-and-registers-part-2/', desc: 'Registers and data types deep dive' },
          { type: 'Tutorial', title: 'ARM Instruction Set (Part 3) — Azeria Labs', url: 'https://azeria-labs.com/arm-instruction-set-part-3/', desc: 'Complete instruction set walkthrough' },
          { type: 'Reference', title: 'ARM Assembly Basics Cheatsheet — Azeria Labs', url: 'https://azeria-labs.com/assembly-basics-cheatsheet/', desc: 'Quick reference for all ARM instructions' },
          { type: 'Tutorial', title: 'Introducing ARM Assembly Language — Carl Burch', url: 'https://cburch.com/books/arm/', desc: 'Free online textbook' },
          { type: 'Tutorial', title: 'ARM Assembly By Example', url: 'https://armasm.com/', desc: 'Learn by reading real examples' },
          { type: 'Article', title: 'Learn Assembly Language Programming with ARM — freeCodeCamp', url: 'https://www.freecodecamp.org/news/learn-assembly-language-programming-with-arm/', desc: 'Companion article to the freeCodeCamp video' },
        ]},
      ],
    },
    {
      id: 4,
      title: "Writing an Assembler in Python",
      subtitle: "Parsing assembly text, symbol tables, and encoding to binary",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>Writing an Assembler in Python</h2>
<p>An assembler is the bridge between human-readable assembly language and the binary machine code that a CPU understands. Writing your own assembler forces you to understand exactly how every instruction is encoded as bits.</p>

<h3>What Does an Assembler Do?</h3>
<ol>
<li><strong>Lexing/Tokenizing</strong>: Split each line into tokens (labels, opcodes, operands, comments)</li>
<li><strong>Parsing</strong>: Determine the instruction type and extract operands</li>
<li><strong>Symbol Resolution</strong>: Build a symbol table mapping labels to addresses</li>
<li><strong>Encoding</strong>: Convert each instruction into its binary representation</li>
<li><strong>Output</strong>: Write the binary machine code to a file</li>
</ol>

<h3>The Two-Pass Algorithm</h3>
<p>Most assemblers use two passes over the source code:</p>
<p><strong>Pass 1 — Build the Symbol Table:</strong> Read each line. If a line has a label (e.g., <code>loop:</code>), record the label name and current address in the symbol table. Track the current address (increment by instruction size). Do NOT generate code yet.</p>
<p><strong>Pass 2 — Generate Machine Code:</strong> Read each line again. Parse the instruction and operands. Look up any label references in the symbol table. Encode the instruction as binary. Write the output.</p>
<p>The reason for two passes: a branch instruction might reference a label that appears later in the code (a "forward reference"). Pass 1 discovers all labels first so Pass 2 can resolve them.</p>
` },
        { type: 'text', html: '<h3>A Minimal ARM Assembler in Python</h3><p>Here is a step-by-step implementation:</p>' },
        { type: 'code', label: 'arm_assembler.py — Condition codes and opcodes', code: `import re
import struct

# Condition code lookup
CONDITIONS = {
    'EQ': 0b0000, 'NE': 0b0001, 'CS': 0b0010, 'CC': 0b0011,
    'MI': 0b0100, 'PL': 0b0101, 'VS': 0b0110, 'VC': 0b0111,
    'HI': 0b1000, 'LS': 0b1001, 'GE': 0b1010, 'LT': 0b1011,
    'GT': 0b1100, 'LE': 0b1101, 'AL': 0b1110, '':   0b1110,
}

# Data processing opcodes (match ARM encoding exactly)
DP_OPCODES = {
    'AND': 0b0000, 'EOR': 0b0001, 'SUB': 0b0010, 'RSB': 0b0011,
    'ADD': 0b0100, 'ADC': 0b0101, 'SBC': 0b0110, 'RSC': 0b0111,
    'TST': 0b1000, 'TEQ': 0b1001, 'CMP': 0b1010, 'CMN': 0b1011,
    'ORR': 0b1100, 'MOV': 0b1101, 'BIC': 0b1110, 'MVN': 0b1111,
}` },
        { type: 'code', label: 'arm_assembler.py — Tokenizer and parsers', code: `def tokenize(line):
    """Remove comments and split a line into label, mnemonic, operands."""
    line = line.split('@')[0].split(';')[0].strip()
    if not line:
        return None, None, []

    label = None
    if ':' in line:
        label, line = line.split(':', 1)
        label = label.strip()
        line = line.strip()

    if not line:
        return label, None, []

    parts = re.split(r'[,\\s]+', line)
    parts = [p.strip() for p in parts if p.strip()]
    mnemonic = parts[0].upper()
    operands = parts[1:]
    return label, mnemonic, operands

def parse_register(s):
    """Parse 'R0' or 'SP' into register number 0-15."""
    s = s.upper().strip()
    aliases = {'SP': 13, 'LR': 14, 'PC': 15}
    if s in aliases:
        return aliases[s]
    if s.startswith('R'):
        return int(s[1:])
    raise ValueError(f"Invalid register: {s}")

def parse_immediate(s):
    """Parse '#42' or '#0xFF' into an integer."""
    s = s.strip().lstrip('#')
    if s.startswith('0x') or s.startswith('0X'):
        return int(s, 16)
    if s.startswith('0b') or s.startswith('0B'):
        return int(s, 2)
    return int(s)

def encode_immediate(value):
    """Encode a 32-bit value as ARM rotated immediate (8-bit + 4-bit rotation)."""
    value = value & 0xFFFFFFFF
    for rotation in range(16):
        rotated = (value >> (rotation * 2)) | (value << (32 - rotation * 2))
        rotated &= 0xFFFFFFFF
        if rotated <= 0xFF:
            return (rotation, rotated)
    raise ValueError(f"Cannot encode {value} as ARM immediate")` },
        { type: 'code', label: 'arm_assembler.py — Instruction encoders', code: `def encode_data_processing(opcode_name, cond, set_flags, rd, rn, operand2, is_imm):
    """Encode a data processing instruction as a 32-bit word."""
    cond_bits = CONDITIONS[cond]
    opcode = DP_OPCODES[opcode_name]
    s_bit = 1 if set_flags else 0
    i_bit = 1 if is_imm else 0

    if is_imm:
        rotation, imm8 = encode_immediate(operand2)
        op2_bits = (rotation << 8) | imm8
    else:
        op2_bits = operand2  # register number

    instruction = (cond_bits << 28) | (0b00 << 26) | (i_bit << 25) | \\
                  (opcode << 21) | (s_bit << 20) | (rn << 16) | \\
                  (rd << 12) | op2_bits
    return instruction

def encode_branch(cond, offset_bytes, link=False):
    """Encode a branch instruction."""
    cond_bits = CONDITIONS[cond]
    l_bit = 1 if link else 0
    # Offset is PC-relative; ARM PC is 8 ahead during execute
    offset_words = (offset_bytes - 8) >> 2
    offset_field = offset_words & 0x00FFFFFF
    instruction = (cond_bits << 28) | (0b101 << 25) | (l_bit << 24) | offset_field
    return instruction` },
        { type: 'code', label: 'arm_assembler.py — Two-pass assembler class', code: `class Assembler:
    def __init__(self):
        self.symbols = {}
        self.output = []

    def pass1(self, lines):
        """First pass: build symbol table."""
        address = 0
        for line in lines:
            label, mnemonic, operands = tokenize(line)
            if label:
                self.symbols[label] = address
            if mnemonic:
                address += 4  # Each ARM instruction = 4 bytes

    def pass2(self, lines):
        """Second pass: generate machine code."""
        address = 0
        for line in lines:
            label, mnemonic, operands = tokenize(line)
            if not mnemonic:
                continue

            base_op, cond, set_flags = split_mnemonic(mnemonic)

            if base_op in ('MOV', 'MVN'):
                rd = parse_register(operands[0])
                if operands[1].startswith('#'):
                    imm = parse_immediate(operands[1])
                    instr = encode_data_processing(base_op, cond, set_flags, rd, 0, imm, True)
                else:
                    rm = parse_register(operands[1])
                    instr = encode_data_processing(base_op, cond, set_flags, rd, 0, rm, False)

            elif base_op in ('CMP', 'CMN', 'TST', 'TEQ'):
                rn = parse_register(operands[0])
                if operands[1].startswith('#'):
                    imm = parse_immediate(operands[1])
                    instr = encode_data_processing(base_op, cond, True, 0, rn, imm, True)
                else:
                    rm = parse_register(operands[1])
                    instr = encode_data_processing(base_op, cond, True, 0, rn, rm, False)

            elif base_op in DP_OPCODES:
                rd = parse_register(operands[0])
                rn = parse_register(operands[1])
                if operands[2].startswith('#'):
                    imm = parse_immediate(operands[2])
                    instr = encode_data_processing(base_op, cond, set_flags, rd, rn, imm, True)
                else:
                    rm = parse_register(operands[2])
                    instr = encode_data_processing(base_op, cond, set_flags, rd, rn, rm, False)

            elif base_op in ('B', 'BL'):
                target_addr = self.symbols[operands[0]]
                offset = target_addr - address
                instr = encode_branch(cond, offset, link=(base_op == 'BL'))

            else:
                raise ValueError(f"Unknown instruction: {mnemonic}")

            self.output.append(instr)
            address += 4

    def assemble(self, source):
        lines = source.strip().split('\\n')
        self.pass1(lines)
        self.pass2(lines)
        return self.output

    def to_hex(self):
        return ['0x{:08X}'.format(w) for w in self.output]

    def to_binary(self):
        return b''.join(struct.pack('<I', w) for w in self.output)` },
        { type: 'code', label: 'Example usage', code: `# split_mnemonic helper (needed by pass2)
def split_mnemonic(mnemonic):
    set_flags = False
    cond = ''
    for base_op in list(DP_OPCODES.keys()) + ['B', 'BL', 'BX', 'LDR', 'STR']:
        if mnemonic.startswith(base_op):
            rest = mnemonic[len(base_op):]
            if rest.endswith('S'):
                set_flags = True
                rest = rest[:-1]
            if rest in CONDITIONS:
                cond = rest
            return base_op, cond, set_flags
    return mnemonic, '', False

# --- Test ---
source = """
    MOV R0, #0
    MOV R1, #10
loop:
    ADD R0, R0, R1
    SUBS R1, R1, #1
    BNE loop
"""

asm = Assembler()
asm.assemble(source)
for i, h in enumerate(asm.to_hex()):
    print(f"  {i*4:04X}: {h}")
print(f"Symbols: {asm.symbols}")` },
        { type: 'text', html: `
<h3>How Encoding Works — Worked Example</h3>
<p>Let us trace encoding <code>ADD R0, R1, #10</code>:</p>
<ol>
<li>Condition = AL (always) = <code>0b1110</code></li>
<li>Class bits = <code>0b00</code> (data processing)</li>
<li>I bit = 1 (immediate operand)</li>
<li>Opcode = ADD = <code>0b0100</code></li>
<li>S bit = 0 (no flag update)</li>
<li>Rn = R1 = <code>0b0001</code></li>
<li>Rd = R0 = <code>0b0000</code></li>
<li>Operand2: 10 = 0x0A, rotation = 0, so operand2 = <code>0x00A</code></li>
</ol>
<p>Binary: <code>1110 00 1 0100 0 0001 0000 0000 00001010</code> = Hex: <code>0xE281000A</code></p>

<h3>Extending the Assembler</h3>
<p>To make a complete assembler you would add:</p>
<ul>
<li><strong>LDR/STR encoding</strong>: Parse addressing modes like <code>[R1, #4]</code></li>
<li><strong>Pseudo-instructions</strong>: Handle <code>LDR R0, =label</code> (load address via literal pool)</li>
<li><strong>Directives</strong>: <code>.word</code>, <code>.byte</code>, <code>.ascii</code>, <code>.data</code>, <code>.text</code>, <code>.global</code></li>
<li><strong>Error handling</strong>: Line numbers in error messages, range checking</li>
<li><strong>ELF output</strong>: Generate proper ELF binary files</li>
</ul>
` },
        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (full playlist)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the assembler above and test it. Verify the hex output against an online ARM assembler or the ARM ARM.',
          'Extend the assembler to support LDR and STR with immediate offset: LDR R0, [R1, #4].',
          'Add support for the .word directive so you can define data in memory.',
          'Implement forward and backward label resolution for branch instructions. Test with a program containing both.',
          'Add error reporting: detect invalid register names, out-of-range immediates, undefined labels. Include line numbers.',
          'Research the ELF binary format. Modify your assembler to output a minimal ELF file executable on a Raspberry Pi or under QEMU.',
        ]},
        { type: 'resources', links: [
          { type: 'Project', title: 'PyARM-Assembler — ARM7 Assembler in Python', url: 'https://github.com/ankushbhardwxj/PyARM-Assembler', desc: 'Complete one-pass ARM assembler in Python' },
          { type: 'Project', title: 'Simple ARMv7 Assembler in Python', url: 'https://github.com/garrett92895/simple-armv7-assembler', desc: 'Python 3 assembler with simplified syntax' },
          { type: 'Tutorial', title: 'Writing an Assembler in Python — Hackaday.io', url: 'https://hackaday.io/project/10576-mucpu-an-8-bit-mcu/log/36010-writing-an-assembler-in-python', desc: 'Step-by-step assembler walkthrough' },
          { type: 'Tutorial', title: 'Assembler in Python — Open Book Project', url: 'http://www.openbookproject.net/py4fun/mm/assembler.html', desc: 'Classic Python assembler tutorial' },
          { type: 'Course', title: 'Nand2Tetris Project 6: Assembler', url: 'https://www.nand2tetris.org/project06', desc: 'Build an assembler as part of the Nand2Tetris course' },
          { type: 'Tool', title: 'Keystone Engine — Multi-architecture Assembler', url: 'https://www.keystone-engine.org/', desc: 'Professional assembler framework with Python bindings' },
          { type: 'Article', title: 'Assembly, Disassembly and Emulation using Python', url: 'https://thepythoncode.com/article/arm-x86-64-assembly-disassembly-and-emulation-in-python', desc: 'Using Keystone, Capstone, and Unicorn in Python' },
        ]},
      ],
    },
    {
      id: 5,
      title: "CPU in Verilog: Program Counter & Instruction Fetch",
      subtitle: "The first components of our CPU design",
      duration: "60 min",
      content: [
        { type: 'text', html: `
<h2>Program Counter and Instruction Fetch</h2>
<p>This is the first module in our CPU design series. We build each component in Verilog and connect them to form a working processor.</p>

<h3>The Program Counter (PC)</h3>
<p>The program counter is the simplest but most critical register in the CPU. It holds the address of the next instruction to fetch from memory.</p>
` },
        { type: 'code', label: 'program_counter.v', code: `module program_counter (
    input  wire        clk,
    input  wire        reset,
    input  wire        branch_taken,
    input  wire [31:0] branch_target,
    output reg  [31:0] pc
);
    always @(posedge clk or posedge reset) begin
        if (reset)
            pc <= 32'h00000000;        // Start at address 0
        else if (branch_taken)
            pc <= branch_target;       // Jump to branch target
        else
            pc <= pc + 32'd4;          // Next instruction (4 bytes)
    end
endmodule` },
        { type: 'text', html: `
<p>Key points: on <strong>reset</strong>, PC goes to 0x00000000 (the reset vector). On <strong>branch</strong>, PC loads the target address. Otherwise, PC increments by 4 (each ARM instruction is 4 bytes). Updates are <strong>synchronous</strong> on the rising clock edge.</p>
<h3>Instruction Memory</h3>
<p>For a simple design, instruction memory is a ROM initialized from a hex file:</p>
` },
        { type: 'code', label: 'instruction_memory.v', code: `module instruction_memory (
    input  wire [31:0] address,
    output wire [31:0] instruction
);
    reg [31:0] mem [0:255];  // 256 words = 1KB

    initial begin
        $readmemh("program.hex", mem);
    end

    // Combinational read (available immediately)
    assign instruction = mem[address[9:2]];  // Word-aligned: ignore bottom 2 bits
endmodule` },
        { type: 'info', variant: 'info', title: 'Word Alignment',
          html: '<p><code>address[9:2]</code> extracts bits 9 through 2, effectively dividing the byte address by 4 to get the word index. The bottom 2 bits are always 0 for word-aligned ARM instructions.</p>' },
        { type: 'text', html: '<h3>Instruction Fetch Unit</h3><p>The fetch unit wires the PC to instruction memory:</p>' },
        { type: 'code', label: 'fetch_unit.v', code: `module fetch_unit (
    input  wire        clk,
    input  wire        reset,
    input  wire        branch_taken,
    input  wire [31:0] branch_target,
    output wire [31:0] instruction,
    output wire [31:0] pc_out
);
    wire [31:0] pc;

    program_counter pc_reg (
        .clk(clk), .reset(reset),
        .branch_taken(branch_taken),
        .branch_target(branch_target),
        .pc(pc)
    );

    instruction_memory imem (
        .address(pc),
        .instruction(instruction)
    );

    assign pc_out = pc;
endmodule` },
        { type: 'text', html: '<h3>Testbench</h3><p>Always write testbenches for your modules:</p>' },
        { type: 'code', label: 'fetch_unit_tb.v', code: `module fetch_unit_tb;
    reg         clk, reset, branch_taken;
    reg  [31:0] branch_target;
    wire [31:0] instruction, pc_out;

    fetch_unit uut (
        .clk(clk), .reset(reset),
        .branch_taken(branch_taken), .branch_target(branch_target),
        .instruction(instruction), .pc_out(pc_out)
    );

    initial clk = 0;
    always #5 clk = ~clk;  // 10ns period = 100MHz

    initial begin
        $dumpfile("fetch_unit.vcd");
        $dumpvars(0, fetch_unit_tb);
        reset = 1; branch_taken = 0; branch_target = 0;
        #10 reset = 0;
        #100;  // Let it fetch 10 instructions
        branch_taken = 1; branch_target = 32'h00000000;  // Test branch
        #10 branch_taken = 0;
        #50 $finish;
    end

    always @(posedge clk)
        $display("PC=%h  Instr=%h", pc_out, instruction);
endmodule` },
        { type: 'code', label: 'How to simulate with Icarus Verilog', code: `iverilog -o fetch_tb fetch_unit_tb.v fetch_unit.v program_counter.v instruction_memory.v
vvp fetch_tb
gtkwave fetch_unit.vcd   # View waveforms` },

        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the program_counter module and write a testbench verifying the PC increments by 4 each cycle.',
          'Create a program.hex file with 8 NOP instructions (0xE1A00000). Load into instruction memory and verify fetch order.',
          'Add a "stall" input to the program counter that freezes the PC when asserted.',
          'Modify instruction memory to use synchronous reads (registered output). What timing implications does this have?',
          'Write a hex program that counts from 0 to 10 and verify your fetch unit retrieves each instruction correctly.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'CPU Tutorial in Verilog — Hugh Perkins (GitHub)', url: 'https://github.com/hughperkins/cpu-tutorial', desc: 'Exercises for building a CPU in Verilog from scratch' },
          { type: 'Article', title: 'Teach Yourself Verilog With This Tiny CPU Design — Hackaday', url: 'https://hackaday.com/2015/08/01/teach-yourself-verilog-with-this-tiny-cpu-design/', desc: 'Learn Verilog by building a small CPU' },
          { type: 'Tutorial', title: 'Verilog Code for Microcontroller — FPGA4Student', url: 'https://www.fpga4student.com/2016/11/verilog-microcontroller-code.html', desc: 'Complete microcontroller design in Verilog' },
          { type: 'Lab', title: 'Tiny CPU Design Lab — UC San Diego', url: 'https://cseweb.ucsd.edu//classes/fa12/cse140L-a/LAB4_tinycpu.pdf', desc: 'University lab on building a tiny CPU' },
          { type: 'Tutorial', title: 'Processor Design in Verilog — Devansh Lodha', url: 'https://devansh-lodha.github.io/blog/posts/processor_verilog/processor_verilog.html', desc: 'Blog walkthrough of CPU design' },
        ]},
      ],
    },
    {
      id: 6,
      title: "CPU in Verilog: Instruction Decoder",
      subtitle: "Extracting fields from the instruction word",
      duration: "60 min",
      content: [
        { type: 'text', html: `
<h2>Instruction Decoder</h2>
<p>The instruction decoder takes the raw 32-bit instruction and extracts all the fields the CPU needs: which operation, which registers, what immediate value, etc. It is purely <strong>combinational logic</strong> — no clock, no state. Think of it as a smart splitter cable.</p>
<p>ARM's encoding is very regular — bits 31-28 are ALWAYS the condition code, bits 27-26 tell you the instruction class, and fields within each class are in consistent positions. This regularity is a hallmark of RISC design.</p>
` },
        { type: 'code', label: 'instruction_decoder.v', code: `module instruction_decoder (
    input  wire [31:0] instruction,
    output wire [3:0]  cond,          // Condition code
    output wire [3:0]  opcode,        // ALU operation
    output wire        s_bit,         // Update flags?
    output wire [3:0]  rn,            // Source register 1
    output wire [3:0]  rd,            // Destination register
    output wire [3:0]  rm,            // Source register 2
    output wire [11:0] imm12,         // Immediate field
    output wire        imm_select,    // 1=immediate, 0=register
    output wire        is_data_proc,
    output wire        is_load,
    output wire        is_store,
    output wire        is_branch,
    output wire        is_branch_link,
    output wire [23:0] branch_offset
);
    wire [1:0] instr_class = instruction[27:26];

    assign cond       = instruction[31:28];
    assign opcode     = instruction[24:21];
    assign s_bit      = instruction[20];
    assign rn         = instruction[19:16];
    assign rd         = instruction[15:12];
    assign rm         = instruction[3:0];
    assign imm12      = instruction[11:0];
    assign imm_select = instruction[25];

    assign is_data_proc   = (instr_class == 2'b00);
    assign is_load        = (instr_class == 2'b01) &&  instruction[20];
    assign is_store       = (instr_class == 2'b01) && ~instruction[20];
    assign is_branch      = (instruction[27:25] == 3'b101);
    assign is_branch_link = is_branch && instruction[24];
    assign branch_offset  = instruction[23:0];
endmodule` },
        { type: 'text', html: '<h3>Condition Evaluator</h3><p>Determines whether an instruction should execute based on the CPSR flags:</p>' },
        { type: 'code', label: 'condition_evaluator.v', code: `module condition_evaluator (
    input  wire [3:0] cond,
    input  wire       flag_n, flag_z, flag_c, flag_v,
    output reg        execute
);
    always @(*) begin
        case (cond)
            4'b0000: execute = flag_z;                        // EQ
            4'b0001: execute = ~flag_z;                       // NE
            4'b0010: execute = flag_c;                        // CS
            4'b0011: execute = ~flag_c;                       // CC
            4'b0100: execute = flag_n;                        // MI
            4'b0101: execute = ~flag_n;                       // PL
            4'b0110: execute = flag_v;                        // VS
            4'b0111: execute = ~flag_v;                       // VC
            4'b1000: execute = flag_c & ~flag_z;              // HI
            4'b1001: execute = ~flag_c | flag_z;              // LS
            4'b1010: execute = (flag_n == flag_v);            // GE
            4'b1011: execute = (flag_n != flag_v);            // LT
            4'b1100: execute = ~flag_z & (flag_n == flag_v);  // GT
            4'b1101: execute = flag_z | (flag_n != flag_v);   // LE
            4'b1110: execute = 1'b1;                          // AL
            4'b1111: execute = 1'b1;                          // Unconditional
        endcase
    end
endmodule` },
        { type: 'text', html: '<h3>Immediate Value Decoder</h3><p>ARM encodes immediates as an 8-bit value rotated right by twice a 4-bit rotation amount:</p>' },
        { type: 'code', label: 'immediate_decoder.v', code: `module immediate_decoder (
    input  wire [11:0] imm12,
    output wire [31:0] imm_value
);
    wire [3:0] rotation = imm12[11:8];
    wire [7:0] imm8     = imm12[7:0];
    wire [4:0] shift_amount = {rotation, 1'b0};  // rotation * 2

    assign imm_value = ({24'b0, imm8} >> shift_amount) |
                       ({24'b0, imm8} << (32 - shift_amount));
endmodule` },

        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },
        { type: 'video', id: 'FZGugFqdr60', title: 'The Central Processing Unit — Crash Course CS #7' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement instruction_decoder and test with known instruction encodings: ADD R0, R1, R2 = 0xE0810002. Verify all output fields.',
          'Implement condition_evaluator and test all 15 condition codes with flag values that should pass and fail.',
          'Add LDR/STR decoding: extract P, U, W, B, L bits and the offset field.',
          'Write the immediate_decoder and test with: #0xFF (rot=0), #0xFF0 (rot=14), #0xC000003F (rot=1).',
          'Combine the decoder with the fetch unit. Feed instructions through and print each decoded field.',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'Instruction Decoder Details — Hackaday.io', url: 'https://hackaday.io/project/21496-fpga-nes/log/58971-instruction-decoder', desc: 'Practical instruction decoder implementation' },
          { type: 'Reference', title: 'ARM Instruction Set Encoding — ARM Developer', url: 'https://developer.arm.com/documentation/ddi0406/c/Application-Level-Architecture/ARM-Instruction-Set-Encoding/ARM-instruction-set-encoding', desc: 'Official ARM encoding reference' },
          { type: 'Article', title: 'ARM Binary Analysis — Understanding Instruction Encoding', url: 'https://medium.com/@mohamad.aerabi/arm-binary-analysis-part7-613d1dc9b9e2', desc: 'Reverse engineering ARM instruction encoding' },
          { type: 'Reference', title: 'ARM Instruction Set — NTU', url: 'https://www.csie.ntu.edu.tw/~cyy/courses/assembly/12fall/lectures/handouts/lec09_ARMisa.pdf', desc: 'Complete ARM ISA lecture slides' },
        ]},
      ],
    },
    {
      id: 7,
      title: "CPU in Verilog: Register File",
      subtitle: "Fast local storage with dual read ports",
      duration: "45 min",
      content: [
        { type: 'text', html: `
<h2>Register File</h2>
<p>The register file is the CPU's fast, local storage — a small bank of registers that hold the data the CPU is actively working with. For ARM, we need 16 registers of 32 bits each, with <strong>two simultaneous read ports</strong> and <strong>one write port</strong>.</p>

<h3>Why Two Read Ports?</h3>
<p>Most ARM data processing instructions need two source operands (e.g., <code>ADD R0, R1, R2</code> reads both R1 and R2). Two read ports allow both to be read in the same clock cycle.</p>

<h3>Design Decisions</h3>
<ul>
<li><strong>Reads are combinational</strong>: Output the register value immediately when the address changes — no clock wait.</li>
<li><strong>Writes are synchronous</strong>: Data is written on the rising clock edge, preventing race conditions.</li>
<li><strong>Write-after-read forwarding</strong>: If a register is read and written in the same cycle, forward the write data to the read output.</li>
</ul>
` },
        { type: 'code', label: 'register_file.v', code: `module register_file (
    input  wire        clk,
    input  wire        reset,
    // Write port
    input  wire        write_enable,
    input  wire [3:0]  write_addr,
    input  wire [31:0] write_data,
    // Read port 1
    input  wire [3:0]  read_addr1,
    output wire [31:0] read_data1,
    // Read port 2
    input  wire [3:0]  read_addr2,
    output wire [31:0] read_data2,
    // PC always available
    output wire [31:0] pc_out
);
    reg [31:0] registers [0:15];
    integer i;

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            for (i = 0; i < 16; i = i + 1)
                registers[i] <= 32'b0;
        end else if (write_enable) begin
            registers[write_addr] <= write_data;
        end
    end

    // Combinational reads with forwarding
    assign read_data1 = (write_enable && write_addr == read_addr1)
                        ? write_data : registers[read_addr1];
    assign read_data2 = (write_enable && write_addr == read_addr2)
                        ? write_data : registers[read_addr2];
    assign pc_out     = registers[15];
endmodule` },
        { type: 'code', label: 'register_file_tb.v', code: `module register_file_tb;
    reg         clk, reset, write_enable;
    reg  [3:0]  write_addr, read_addr1, read_addr2;
    reg  [31:0] write_data;
    wire [31:0] read_data1, read_data2, pc_out;

    register_file uut (.*);

    initial clk = 0;
    always #5 clk = ~clk;

    initial begin
        reset = 1; write_enable = 0; #10 reset = 0;
        // Write 42 to R0
        write_enable = 1; write_addr = 4'd0; write_data = 32'd42; #10;
        // Write 100 to R1
        write_addr = 4'd1; write_data = 32'd100; #10;
        write_enable = 0;
        // Read both
        read_addr1 = 4'd0; read_addr2 = 4'd1; #10;
        $display("R0=%d, R1=%d", read_data1, read_data2);
        #20 $finish;
    end
endmodule` },

        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the register_file module and test writing to and reading from every register (R0 through R15).',
          'Test write-after-read forwarding: read and write the same register in the same cycle and verify forwarding works.',
          'Modify so writes to R15 (PC) trigger a branch signal output.',
          'Implement banked registers for FIQ mode: R8-R14 have separate copies. Add a mode input.',
          'Synthesize for an FPGA and report LUT/flip-flop usage.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Designing a Register File in Verilog — CircuitCove', url: 'https://circuitcove.com/design-examples-register-file/', desc: 'Detailed register file design guide' },
          { type: 'Lab', title: 'Verilog Design of a Register File — U-Aizu', url: 'https://u-aizu.ac.jp/~yliu/teaching/comparch/lab2.html', desc: 'University lab on register file implementation' },
          { type: 'Tutorial', title: 'Exploring Register Files — FPGA Coding', url: 'https://fpgacoding.com/exploring-register-files/', desc: 'Multi-port register file design patterns' },
          { type: 'Lab', title: 'Register File Lab — BYU ECEn 323', url: 'https://ecen323wiki.groups.et.byu.net/labs/lab-03/', desc: 'Hands-on register file lab assignment' },
        ]},
      ],
    },
    {
      id: 8,
      title: "CPU in Verilog: ALU (Arithmetic Logic Unit)",
      subtitle: "The computational heart of the CPU",
      duration: "60 min",
      content: [
        { type: 'text', html: `
<h2>Arithmetic Logic Unit (ALU)</h2>
<p>The ALU is the computational heart of the CPU. It takes two inputs, performs an operation selected by a control signal, and produces a result along with condition flags.</p>
` },
        { type: 'table', headers: ['Opcode', 'Name', 'Operation', 'Notes'],
          rows: [
            ['0000', 'AND', 'A & B', 'Bitwise AND'],
            ['0001', 'EOR', 'A ^ B', 'Bitwise XOR'],
            ['0010', 'SUB', 'A - B', 'Subtract'],
            ['0011', 'RSB', 'B - A', 'Reverse subtract'],
            ['0100', 'ADD', 'A + B', 'Add'],
            ['0101', 'ADC', 'A + B + C', 'Add with carry'],
            ['1000', 'TST', 'A & B', 'Test (flags only, discard result)'],
            ['1010', 'CMP', 'A - B', 'Compare (flags only)'],
            ['1100', 'ORR', 'A | B', 'Bitwise OR'],
            ['1101', 'MOV', 'B', 'Move (pass through)'],
            ['1110', 'BIC', 'A & ~B', 'Bit clear'],
            ['1111', 'MVN', '~B', 'Move NOT'],
          ]
        },
        { type: 'code', label: 'alu.v', code: `module alu (
    input  wire [31:0] operand_a,
    input  wire [31:0] operand_b,
    input  wire [3:0]  alu_op,
    input  wire        carry_in,
    output reg  [31:0] result,
    output wire        flag_n,
    output wire        flag_z,
    output reg         flag_c,
    output reg         flag_v
);
    wire [32:0] add_result = {1'b0, operand_a} + {1'b0, operand_b};
    wire [32:0] sub_result = {1'b0, operand_a} - {1'b0, operand_b};

    wire add_overflow = (~operand_a[31] & ~operand_b[31] &  add_result[31]) |
                        ( operand_a[31] &  operand_b[31] & ~add_result[31]);
    wire sub_overflow = (~operand_a[31] &  operand_b[31] &  sub_result[31]) |
                        ( operand_a[31] & ~operand_b[31] & ~sub_result[31]);

    always @(*) begin
        flag_c = 1'b0; flag_v = 1'b0;
        case (alu_op)
            4'b0000: result = operand_a & operand_b;             // AND
            4'b0001: result = operand_a ^ operand_b;             // EOR
            4'b0010: begin result = sub_result[31:0];            // SUB
                     flag_c = ~sub_result[32]; flag_v = sub_overflow; end
            4'b0011: result = operand_b - operand_a;             // RSB
            4'b0100: begin result = add_result[31:0];            // ADD
                     flag_c = add_result[32]; flag_v = add_overflow; end
            4'b0101: result = operand_a + operand_b + carry_in;  // ADC
            4'b1000: result = operand_a & operand_b;             // TST
            4'b1010: begin result = sub_result[31:0];            // CMP
                     flag_c = ~sub_result[32]; flag_v = sub_overflow; end
            4'b1100: result = operand_a | operand_b;             // ORR
            4'b1101: result = operand_b;                         // MOV
            4'b1110: result = operand_a & ~operand_b;            // BIC
            4'b1111: result = ~operand_b;                        // MVN
            default: result = 32'b0;
        endcase
    end

    assign flag_n = result[31];
    assign flag_z = (result == 32'b0);
endmodule` },
        { type: 'text', html: '<h3>CPSR Register</h3><p>Flags are stored in the CPSR and only updated when the S bit is set:</p>' },
        { type: 'code', label: 'cpsr_register.v', code: `module cpsr_register (
    input  wire clk, reset, update_flags,
    input  wire flag_n_in, flag_z_in, flag_c_in, flag_v_in,
    output reg  flag_n, flag_z, flag_c, flag_v
);
    always @(posedge clk or posedge reset) begin
        if (reset)
            {flag_n, flag_z, flag_c, flag_v} <= 4'b0;
        else if (update_flags)
            {flag_n, flag_z, flag_c, flag_v} <= {flag_n_in, flag_z_in, flag_c_in, flag_v_in};
    end
endmodule` },

        { type: 'video', id: '1I5ZMmrOfnA', title: 'How Computers Calculate — the ALU: Crash Course CS #5' },
        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the ALU and write a comprehensive testbench. Test ADD, SUB, AND, ORR, MOV with known inputs — verify result and all four flags.',
          'Test overflow detection: find inputs for ADD and SUB that cause V flag. Explain why 0x7FFFFFFF + 1 overflows.',
          'Implement a barrel shifter for operand2. Support LSL, LSR, ASR, ROR with immediate and register shift amounts.',
          'Connect the ALU to the CPSR register. Verify flags update only when update_flags is asserted.',
          'Synthesize your ALU for an FPGA and check the maximum clock frequency.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Verilog Code for ALU — FPGA4Student', url: 'https://www.fpga4student.com/2017/06/Verilog-code-for-ALU.html', desc: 'Step-by-step ALU design in Verilog' },
          { type: 'Article', title: 'Designing an 8-bit ALU in Verilog — Medium', url: 'https://medium.com/@rohitdhanjee25/designing-an-8-bit-alu-in-verilog-behavioral-modeling-flag-management-and-common-implementation-ec8cea68359e', desc: 'Behavioral modeling and flag management' },
          { type: 'Tutorial', title: 'ALU Verilog Code — Circuit Fever', url: 'https://circuitfever.com/alu-verilog-code', desc: 'Simple ALU with test cases' },
        ]},
      ],
    },
    {
      id: 9,
      title: "CPU in Verilog: Memory Interface & Control Unit",
      subtitle: "Data memory, control signals, and the complete single-cycle CPU",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>Memory Interface</h2>
<p>The memory interface connects the CPU to data memory, handling LDR (load) and STR (store) operations.</p>
` },
        { type: 'code', label: 'data_memory.v', code: `module data_memory (
    input  wire        clk,
    input  wire        mem_read,
    input  wire        mem_write,
    input  wire [31:0] address,
    input  wire [31:0] write_data,
    output wire [31:0] read_data
);
    reg [31:0] mem [0:1023];  // 4KB data memory

    always @(posedge clk) begin
        if (mem_write)
            mem[address[11:2]] <= write_data;
    end

    assign read_data = mem_read ? mem[address[11:2]] : 32'b0;
endmodule` },
        { type: 'text', html: `
<h2>Control Unit</h2>
<p>The control unit looks at the decoded instruction and generates all the control signals that tell the datapath what to do. It is the "brain" that coordinates all other modules.</p>
` },
        { type: 'code', label: 'control_unit.v', code: `module control_unit (
    input  wire is_data_proc, is_load, is_store,
    input  wire is_branch, is_branch_link,
    input  wire s_bit, cond_met,
    output wire reg_write, mem_read, mem_write,
    output wire mem_to_reg, branch_taken, link_write, update_flags
);
    wire active = cond_met;

    assign reg_write    = active & (is_data_proc | is_load | is_branch_link);
    assign mem_read     = active & is_load;
    assign mem_write    = active & is_store;
    assign mem_to_reg   = is_load;
    assign branch_taken = active & is_branch;
    assign link_write   = active & is_branch_link;
    assign update_flags = active & is_data_proc & s_bit;
endmodule` },
        { type: 'text', html: '<h3>Complete Single-Cycle CPU — Top Module</h3><p>This wires all components together. Every instruction executes in one clock cycle:</p>' },
        { type: 'code', label: 'cpu_top.v — Complete single-cycle ARM CPU', code: `module cpu_top (
    input wire clk,
    input wire reset
);
    // === Wires ===
    wire [31:0] instruction, pc;
    wire        branch_taken;
    wire [31:0] branch_target;
    wire [3:0]  cond, opcode, rn, rd, rm;
    wire        s_bit, imm_select;
    wire [11:0] imm12;
    wire        is_data_proc, is_load, is_store, is_branch, is_branch_link;
    wire [23:0] branch_offset;
    wire [31:0] reg_data1, reg_data2, write_back_data;
    wire        reg_write;
    wire [31:0] alu_result, alu_operand_b, imm_value;
    wire        alu_n, alu_z, alu_c, alu_v;
    wire [31:0] mem_read_data;
    wire        mem_read, mem_write_en, mem_to_reg;
    wire        cond_met, update_flags, link_write;
    wire        flag_n, flag_z, flag_c, flag_v;

    // === FETCH ===
    fetch_unit fetch (
        .clk(clk), .reset(reset),
        .branch_taken(branch_taken), .branch_target(branch_target),
        .instruction(instruction), .pc_out(pc)
    );

    // === DECODE ===
    instruction_decoder decode (
        .instruction(instruction), .cond(cond), .opcode(opcode),
        .s_bit(s_bit), .rn(rn), .rd(rd), .rm(rm),
        .imm12(imm12), .imm_select(imm_select),
        .is_data_proc(is_data_proc), .is_load(is_load),
        .is_store(is_store), .is_branch(is_branch),
        .is_branch_link(is_branch_link), .branch_offset(branch_offset)
    );

    condition_evaluator cond_eval (
        .cond(cond), .flag_n(flag_n), .flag_z(flag_z),
        .flag_c(flag_c), .flag_v(flag_v), .execute(cond_met)
    );

    // === REGISTER FILE ===
    register_file regfile (
        .clk(clk), .reset(reset),
        .write_enable(reg_write),
        .write_addr(is_branch_link ? 4'd14 : rd),
        .write_data(write_back_data),
        .read_addr1(rn), .read_data1(reg_data1),
        .read_addr2(rm), .read_data2(reg_data2),
        .pc_out()
    );

    // === IMMEDIATE DECODE ===
    immediate_decoder imm_dec (.imm12(imm12), .imm_value(imm_value));
    assign alu_operand_b = imm_select ? imm_value : reg_data2;

    // === ALU ===
    alu alu_unit (
        .operand_a(reg_data1), .operand_b(alu_operand_b),
        .alu_op(opcode), .carry_in(flag_c),
        .result(alu_result),
        .flag_n(alu_n), .flag_z(alu_z), .flag_c(alu_c), .flag_v(alu_v)
    );

    // === CPSR ===
    cpsr_register cpsr (
        .clk(clk), .reset(reset), .update_flags(update_flags),
        .flag_n_in(alu_n), .flag_z_in(alu_z),
        .flag_c_in(alu_c), .flag_v_in(alu_v),
        .flag_n(flag_n), .flag_z(flag_z), .flag_c(flag_c), .flag_v(flag_v)
    );

    // === DATA MEMORY ===
    data_memory dmem (
        .clk(clk), .mem_read(mem_read), .mem_write(mem_write_en),
        .address(alu_result), .write_data(reg_data2),
        .read_data(mem_read_data)
    );

    // === CONTROL ===
    control_unit ctrl (
        .is_data_proc(is_data_proc), .is_load(is_load),
        .is_store(is_store), .is_branch(is_branch),
        .is_branch_link(is_branch_link),
        .s_bit(s_bit), .cond_met(cond_met),
        .reg_write(reg_write), .mem_read(mem_read),
        .mem_write(mem_write_en), .mem_to_reg(mem_to_reg),
        .branch_taken(branch_taken), .link_write(link_write),
        .update_flags(update_flags)
    );

    // === WRITE BACK ===
    assign write_back_data = link_write ? (pc + 32'd4) :
                             mem_to_reg ? mem_read_data :
                                          alu_result;

    // === BRANCH TARGET ===
    wire [31:0] sign_ext_offset = {{6{branch_offset[23]}}, branch_offset, 2'b00};
    assign branch_target = pc + sign_ext_offset + 32'd8;
endmodule` },

        { type: 'info', variant: 'success', title: 'Milestone: A Complete CPU',
          html: '<p>You now have a complete single-cycle ARM CPU in Verilog. It can execute data processing instructions (ADD, SUB, MOV, CMP, etc.), load/store (LDR, STR), and branches (B, BL). Every instruction completes in one clock cycle.</p>' },

        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },
        { type: 'video', id: 'FZGugFqdr60', title: 'The Central Processing Unit — Crash Course CS #7' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement data_memory and test writing values to different addresses then reading them back.',
          'Implement control_unit and verify all control signals for each instruction type.',
          'Build the complete cpu_top. Load MOV R0, #5; ADD R0, R0, #3 and verify R0 = 8.',
          'Test a loop: MOV R0, #0; MOV R1, #5; loop: ADD R0, R0, R1; SUBS R1, R1, #1; BNE loop. Verify R0 = 15.',
          'Test LDR/STR: store a value then load it into a different register. Verify correctness.',
          'Add a debug output that displays PC, instruction, and key registers each cycle.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'How to Code a State Machine in Verilog — Digilent', url: 'https://digilent.com/blog/how-to-code-a-state-machine-in-verilog/', desc: 'State machine design patterns for control units' },
          { type: 'Tutorial', title: 'MIPS Single-Cycle Processor in Verilog — FPGA4Student', url: 'https://www.fpga4student.com/2017/01/verilog-code-for-single-cycle-MIPS-processor.html', desc: 'Similar processor design for MIPS architecture' },
          { type: 'Tutorial', title: 'Designing a Single-Port Memory — CircuitCove', url: 'https://circuitcove.com/design-examples-memory/', desc: 'Memory design patterns in Verilog' },
          { type: 'Tutorial', title: 'Initialize Memory in Verilog — Project F', url: 'https://projectf.io/posts/initialize-memory-in-verilog/', desc: 'Loading hex files and memory initialization' },
          { type: 'Reference', title: 'Memories in Verilog — MIT 6.111', url: 'http://web.mit.edu/6.111/www/f2017/handouts/L12.pdf', desc: 'MIT lecture slides on memory design' },
        ]},
      ],
    },
    {
      id: 10,
      title: "CPU in Verilog: Pipelining Basics",
      subtitle: "Overlapping instruction execution for higher throughput",
      duration: "75 min",
      content: [
        { type: 'text', html: `
<h2>Pipelining Basics</h2>
<p>A single-cycle CPU is simple but slow — the clock period must be long enough for the slowest instruction. Pipelining breaks execution into stages and overlaps them, like an assembly line.</p>

<h3>The Classic 5-Stage Pipeline</h3>
` },
        { type: 'table', headers: ['Stage', 'Name', 'What Happens'],
          rows: [
            ['IF', 'Instruction Fetch', 'Read instruction from memory using PC'],
            ['ID', 'Instruction Decode', 'Decode instruction, read registers'],
            ['EX', 'Execute', 'ALU operation or address calculation'],
            ['MEM', 'Memory Access', 'Load from or store to data memory'],
            ['WB', 'Write Back', 'Write result to register file'],
          ]
        },
        { type: 'text', html: `
<p>Without pipelining, each instruction takes the full time of all 5 stages. With pipelining, once the pipeline is full, one instruction completes every clock cycle — even though each instruction still takes 5 cycles start-to-finish.</p>

<h3>Pipeline Registers</h3>
<p>Between each stage, pipeline registers hold intermediate results:</p>
` },
        { type: 'code', label: 'IF/ID Pipeline Register', code: `module if_id_reg (
    input  wire        clk, reset, stall, flush,
    input  wire [31:0] instruction_in, pc_in,
    output reg  [31:0] instruction_out, pc_out
);
    always @(posedge clk or posedge reset) begin
        if (reset || flush) begin
            instruction_out <= 32'hE1A00000;  // NOP
            pc_out          <= 32'b0;
        end else if (!stall) begin
            instruction_out <= instruction_in;
            pc_out          <= pc_in;
        end
        // If stall, registers retain their values
    end
endmodule` },
        { type: 'text', html: `
<h3>Pipeline Hazards</h3>
<p>Hazards are situations where the pipeline must stall or could produce incorrect results.</p>

<h4>1. Data Hazards</h4>
<p>An instruction depends on a result not yet written back:</p>
` },
        { type: 'code', label: 'Data hazard example', code: `ADD R1, R2, R3    @ Writes R1 in WB stage (cycle 5)
SUB R4, R1, R5    @ Reads R1 in ID stage (cycle 3) — R1 not written yet!` },
        { type: 'text', html: `
<p><strong>Solution — Forwarding (Bypassing):</strong> Route the ALU result from EX or MEM stage directly back to EX stage inputs, bypassing the register file.</p>
` },
        { type: 'code', label: 'forwarding_unit.v', code: `module forwarding_unit (
    input  wire [3:0] ex_rn, ex_rm,
    input  wire [3:0] mem_rd, wb_rd,
    input  wire       mem_reg_write, wb_reg_write,
    output reg  [1:0] forward_a,  // 00=reg, 01=MEM fwd, 10=WB fwd
    output reg  [1:0] forward_b
);
    always @(*) begin
        forward_a = (mem_reg_write && mem_rd == ex_rn && mem_rd != 0) ? 2'b01 :
                    (wb_reg_write  && wb_rd  == ex_rn && wb_rd  != 0) ? 2'b10 : 2'b00;
        forward_b = (mem_reg_write && mem_rd == ex_rm && mem_rd != 0) ? 2'b01 :
                    (wb_reg_write  && wb_rd  == ex_rm && wb_rd  != 0) ? 2'b10 : 2'b00;
    end
endmodule` },
        { type: 'text', html: `
<h4>2. Control Hazards (Branch Hazards)</h4>
<p>When a branch is taken, instructions already fetched are wrong and must be <strong>flushed</strong> (replaced with NOPs). More sophisticated CPUs use <strong>branch prediction</strong> to guess whether a branch will be taken.</p>

<h4>3. Structural Hazards</h4>
<p>Two stages need the same resource (e.g., one memory port shared between IF and MEM). ARM avoids this with separate instruction and data memories (Harvard architecture).</p>

<h3>Performance Impact</h3>
` },
        { type: 'table', headers: ['Design', 'CPI', 'Clock Period', 'Throughput'],
          rows: [
            ['Single-cycle', '1', 'Long (sum of all stages)', 'Low'],
            ['Pipelined (ideal)', '1', 'Short (longest stage)', 'High'],
            ['Pipelined (w/ hazards)', '>1', 'Short', 'Medium-High'],
          ]
        },
        { type: 'info', variant: 'warning', title: 'Latency vs Throughput',
          html: '<p>Pipelining does NOT reduce the latency of a single instruction — it increases <strong>throughput</strong> by overlapping many instructions. Each instruction still takes 5 cycles, but one completes every cycle once the pipeline is full.</p>' },

        { type: 'video', id: 'rtAlC5J1U40', title: 'Advanced CPU Designs — Crash Course CS #9' },
        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Add IF/ID, ID/EX, EX/MEM, and MEM/WB pipeline registers to your single-cycle CPU.',
          'Implement the forwarding unit. Test with ADD R1, R2, R3 followed by SUB R4, R1, R5.',
          'Implement pipeline flushing: when a branch is taken in EX, flush IF/ID and ID/EX.',
          'Implement a hazard detection unit that stalls for load-use hazards (LDR followed by dependent instruction).',
          'Measure CPI on the array sum benchmark. Count total cycles vs instructions executed.',
          'Advanced: Implement static branch prediction (always predict not-taken). Count flush cycles.',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'Classic RISC Pipeline — Wikipedia', url: 'https://en.wikipedia.org/wiki/Classic_RISC_pipeline', desc: 'Comprehensive reference on the 5-stage pipeline' },
          { type: 'Article', title: 'RISC-V CPU Pipeline Hazards — Chipmunk Logic', url: 'https://chipmunklogic.com/digital-logic-design/designing-pequeno-risc-v-cpu-from-scratch-part-3-dealing-with-pipeline-hazards/', desc: 'Practical pipeline hazard solutions' },
          { type: 'Article', title: 'Create RISC-V Core: Pipeline — Medium', url: 'https://yoshi-ki.medium.com/create-risc-v-core-using-verilog-hdl-5-pipeline-a18664c3d9e3', desc: 'Step-by-step pipeline implementation' },
          { type: 'Reference', title: 'RISC-V Pipeline Implementation — Lecture Notes', url: 'https://passlab.github.io/CSE564/notes/lecture09_RISCV_Impl_pipeline.pdf', desc: 'University lecture slides on pipelining' },
          { type: 'Project', title: '5-Stage RISC-V Pipeline (GitHub)', url: 'https://github.com/Varunkumar0610/RISC-V-32I-5-stage-Pipeline-Core', desc: 'Complete pipelined RISC-V implementation' },
        ]},
      ],
    },
    {
      id: 11,
      title: "Boot ROM and Serial Bootloader",
      subtitle: "Loading programs into your CPU over UART",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>Boot ROM Concept</h2>
<p>When a processor powers on, it needs code to execute — but RAM is empty. The solution is <strong>Boot ROM</strong>: read-only memory containing the very first code that runs.</p>

<h3>What Happens at Power-On</h3>
<ol>
<li><strong>Power-On Reset (POR)</strong>: Hardware reset clears all registers. The PC loads the <strong>reset vector</strong> address.</li>
<li><strong>Reset Vector</strong>: On ARM, the reset vector is at address 0x00000000. The CPU begins executing from here.</li>
<li><strong>Vector Table</strong>: The first addresses form the exception vector table.</li>
<li><strong>Boot ROM executes</strong>: Sets up the clock, initializes RAM, configures the stack pointer, and loads the next stage.</li>
</ol>
` },
        { type: 'table', headers: ['Address', 'Exception'],
          rows: [
            ['0x00', 'Reset'],
            ['0x04', 'Undefined Instruction'],
            ['0x08', 'Software Interrupt (SVC)'],
            ['0x0C', 'Prefetch Abort'],
            ['0x10', 'Data Abort'],
            ['0x14', 'Reserved'],
            ['0x18', 'IRQ (Interrupt Request)'],
            ['0x1C', 'FIQ (Fast Interrupt Request)'],
          ]
        },
        { type: 'text', html: `
<h3>ARM Cortex-M Boot Sequence</h3>
<p>Cortex-M processors have an elegant boot sequence:</p>
<ol>
<li>Read address 0x00000000 — this contains the <strong>initial Stack Pointer value</strong></li>
<li>Read address 0x00000004 — this contains the <strong>Reset Handler address</strong></li>
<li>Load the SP, jump to the Reset Handler</li>
<li>The Reset Handler (startup code) runs: zeroes BSS, copies initialized data, calls main()</li>
</ol>

<h3>Boot ROM in Our Verilog CPU</h3>
` },
        { type: 'code', label: 'boot_rom.v', code: `module boot_rom (
    input  wire [31:0] address,
    output wire [31:0] data
);
    reg [31:0] rom [0:63];

    initial begin
        rom[0] = 32'hE3A0D902;  // MOV SP, #0x8000
        rom[1] = 32'hE3A00000;  // MOV R0, #0
        rom[2] = 32'hE3A01000;  // MOV R1, #0
        rom[3] = 32'hEB000010;  // BL uart_init
        rom[4] = 32'hEB000020;  // BL load_program
        rom[5] = 32'hE3A0F801;  // MOV PC, #0x4000 (jump to loaded program)
    end

    assign data = rom[address[7:2]];
endmodule` },
        { type: 'text', html: `
<h2>Serial Bootloader Design</h2>
<p>A serial bootloader lets you load programs into your CPU over a UART connection from a host computer, without reprogramming instruction memory.</p>

<h3>How It Works</h3>
<ol>
<li>CPU boots from ROM and runs the bootloader code</li>
<li>Bootloader initializes UART at a known baud rate (e.g., 115200)</li>
<li>Bootloader waits for data on the serial port</li>
<li>Host sends the program binary over serial</li>
<li>Bootloader writes received bytes to RAM</li>
<li>Bootloader jumps to the start of the loaded program</li>
</ol>

<h3>UART Receiver</h3>
<p>UART (Universal Asynchronous Receiver-Transmitter) sends data one bit at a time with a start bit, 8 data bits, and a stop bit:</p>
` },
        { type: 'code', label: 'uart_rx.v — Serial receiver', code: `module uart_rx (
    input  wire       clk,
    input  wire       reset,
    input  wire       rx,
    output reg  [7:0] data_out,
    output reg        data_valid
);
    // 50MHz clock, 115200 baud: 50000000/115200 = 434 clocks per bit
    parameter CLKS_PER_BIT = 434;

    reg [2:0]  state;
    reg [15:0] clk_count;
    reg [2:0]  bit_index;
    reg [7:0]  shift_reg;

    localparam IDLE  = 3'd0, START = 3'd1,
               DATA  = 3'd2, STOP  = 3'd3, DONE = 3'd4;

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            state <= IDLE; data_valid <= 0;
            clk_count <= 0; bit_index <= 0;
        end else begin
            data_valid <= 0;
            case (state)
                IDLE: if (rx == 0) state <= START;  // Start bit detected

                START: begin
                    if (clk_count == CLKS_PER_BIT/2) begin
                        if (rx == 0) begin  // Confirm at midpoint
                            clk_count <= 0; state <= DATA; bit_index <= 0;
                        end else state <= IDLE;
                    end else clk_count <= clk_count + 1;
                end

                DATA: begin
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        clk_count <= 0;
                        shift_reg[bit_index] <= rx;
                        if (bit_index == 7) state <= STOP;
                        else bit_index <= bit_index + 1;
                    end else clk_count <= clk_count + 1;
                end

                STOP: begin
                    if (clk_count == CLKS_PER_BIT - 1) begin
                        data_out <= shift_reg;
                        data_valid <= 1;
                        state <= DONE; clk_count <= 0;
                    end else clk_count <= clk_count + 1;
                end

                DONE: state <= IDLE;
            endcase
        end
    end
endmodule` },
        { type: 'text', html: '<h3>Bootloader State Machine</h3><p>The bootloader receives a 2-byte size header then the program data, assembling 4 bytes into each 32-bit word:</p>' },
        { type: 'code', label: 'bootloader.v', code: `module bootloader (
    input  wire        clk, reset, uart_rx_pin,
    output reg  [31:0] mem_addr, mem_data,
    output reg         mem_write,
    output reg         boot_done
);
    wire [7:0] rx_byte;
    wire       rx_valid;

    uart_rx uart (.clk(clk), .reset(reset), .rx(uart_rx_pin),
                  .data_out(rx_byte), .data_valid(rx_valid));

    reg [2:0]  state;
    reg [1:0]  byte_count;
    reg [31:0] word_buf;
    reg [15:0] words_remaining;

    localparam WAIT_HI = 0, WAIT_LO = 1, RECV = 2, DONE = 3;

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            state <= WAIT_HI; mem_addr <= 32'h00004000;
            mem_write <= 0; boot_done <= 0; byte_count <= 0;
        end else begin
            mem_write <= 0;
            case (state)
                WAIT_HI: if (rx_valid) begin
                    words_remaining[15:8] <= rx_byte; state <= WAIT_LO;
                end
                WAIT_LO: if (rx_valid) begin
                    words_remaining[7:0] <= rx_byte; state <= RECV; byte_count <= 0;
                end
                RECV: if (rx_valid) begin
                    case (byte_count)
                        0: word_buf[7:0]   <= rx_byte;
                        1: word_buf[15:8]  <= rx_byte;
                        2: word_buf[23:16] <= rx_byte;
                        3: begin
                            mem_data  <= {rx_byte, word_buf[23:0]};
                            mem_write <= 1;
                        end
                    endcase
                    if (byte_count == 3) begin
                        byte_count <= 0; mem_addr <= mem_addr + 4;
                        words_remaining <= words_remaining - 1;
                        if (words_remaining == 1) state <= DONE;
                    end else byte_count <= byte_count + 1;
                end
                DONE: boot_done <= 1;
            endcase
        end
    end
endmodule` },
        { type: 'text', html: '<h3>Host-Side Upload Script</h3>' },
        { type: 'code', label: 'upload.py — Send program binary over serial', code: `import serial, struct, sys

def upload(port, baud, binary_file):
    with open(binary_file, 'rb') as f:
        program = f.read()
    while len(program) % 4 != 0:  # Pad to word alignment
        program += b'\\x00'
    num_words = len(program) // 4

    ser = serial.Serial(port, baud, timeout=2)
    ser.write(struct.pack('>H', num_words))  # Send size (2 bytes)
    ser.write(program)                        # Send program data
    print(f"Uploaded {num_words} words ({len(program)} bytes)")
    ser.close()

if __name__ == '__main__':
    upload('/dev/ttyUSB0', 115200, sys.argv[1])` },
        { type: 'text', html: `
<h3>How Bootloaders Work in Real Embedded Systems</h3>
<p>In production systems, bootloaders serve several critical purposes:</p>
<ul>
<li><strong>Firmware Updates</strong>: Receive new firmware over UART, USB, CAN, Ethernet, or wirelessly (OTA)</li>
<li><strong>Secure Boot</strong>: Verify cryptographic signature of application firmware before executing</li>
<li><strong>Dual-Bank / A/B Updates</strong>: Two firmware copies — fall back to previous version if new one is corrupted</li>
<li><strong>Recovery Mode</strong>: If application crashes on boot, re-enter bootloader for new upload</li>
<li><strong>Multi-Stage Boot</strong>: ROM bootloader loads SPL/MLO, which loads U-Boot, which loads Linux kernel</li>
</ul>
` },
        { type: 'info', variant: 'tip', title: 'You Built a Computer',
          html: '<p>With a boot ROM and bootloader, your CPU can now load and run arbitrary programs sent over a serial cable. Combined with the CPU from previous lessons, you have a complete computer system: processor, memory, and I/O. Everything from here — operating systems, compilers, networking — is software running on hardware like what you just built.</p>' },

        { type: 'video', id: 'HyznrdDSSGM', title: 'Building an 8-Bit Breadboard Computer — Ben Eater (playlist)' },

        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement boot_rom for your CPU. Write a boot program that initializes registers and enters an infinite loop. Verify in simulation.',
          'Implement uart_rx and test with a testbench that simulates UART bit timing (start bit, 8 data bits, stop bit).',
          'Build the complete bootloader: simulate sending a 4-instruction program over UART and verify it arrives in RAM.',
          'Write the Python upload script. Test with a real UART-to-USB adapter or in simulation with loopback.',
          'Add CRC (Cyclic Redundancy Check) to the protocol: host sends CRC after data, bootloader verifies before setting boot_done.',
          'Design a bootloader that supports "load new" vs "run existing" modes, selected by a GPIO pin at reset.',
          'Research U-Boot. List its key features and explain how it differs from the simple bootloader you built.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'From Zero to main(): How to Write a Bootloader — Memfault', url: 'https://interrupt.memfault.com/blog/how-to-write-a-bootloader-from-scratch', desc: 'The best bootloader tutorial for ARM Cortex-M' },
          { type: 'Tutorial', title: 'From Zero to main(): Bare Metal C — Memfault', url: 'https://interrupt.memfault.com/blog/zero-to-main-1', desc: 'Understanding what happens before main()' },
          { type: 'Article', title: 'Boot Sequence for ARM Embedded Systems (Part 1)', url: 'https://www.embeddedrelated.com/showarticle/118.php', desc: 'Detailed ARM boot sequence walkthrough' },
          { type: 'Article', title: 'Boot Sequence for ARM Embedded Systems (Part 2)', url: 'https://www.embeddedrelated.com/showarticle/124.php', desc: 'Continuation covering initialization' },
          { type: 'Article', title: 'Bootloaders in Embedded Systems — Embien', url: 'https://www.embien.com/blog/bootloaders-in-embedded-system-architecture-and-features', desc: 'Architecture and features overview' },
          { type: 'Article', title: 'Bootloader 101 — Embedded.com', url: 'https://www.embedded.com/bootloaders-101-making-your-embedded-design-future-proof/', desc: 'Making embedded designs future-proof' },
          { type: 'Tutorial', title: 'Custom Serial Bootloader for RP2040', url: 'https://vanhunteradams.com/Pico/Bootloader/Bootloader.html', desc: 'Practical UART bootloader for Raspberry Pi Pico' },
          { type: 'Tutorial', title: 'STM32 Bootloader Tutorial Part 1 — EmbeTronicX', url: 'https://embetronicx.com/tutorials/microcontrollers/stm32/bootloader/bootloader-basics/', desc: 'STM32 bootloader basics and implementation' },
          { type: 'Article', title: 'ARM Cortex-M Reset Sequence Explained', url: 'https://aticleworld.com/arm-cortex-m-processor-reset-sequence/', desc: 'What happens at reset on Cortex-M' },
          { type: 'Article', title: 'What Happens Before main() on ARM Cortex-M', url: 'https://medium.com/@ragagr116/what-happens-before-main-understanding-the-startup-file-on-arm-cortex-m-46c9f55e1a6b', desc: 'Understanding the startup file' },
          { type: 'Reference', title: 'UART Bootloader Application Note — Silicon Labs (PDF)', url: 'https://www.silabs.com/documents/public/application-notes/AN778.pdf', desc: 'Professional UART bootloader protocol specification' },
          { type: 'Project', title: 'STM32 Bootloader Implementation (GitHub)', url: 'https://github.com/konrad1s/Bootloader', desc: 'Portable bootloader with Python GUI and secure boot' },
        ]},
      ],
    },
  ],
}
