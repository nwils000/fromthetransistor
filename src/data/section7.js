// =============================================================================
// SECTION 7: PHYSICAL HARDWARE
// =============================================================================
// Covers JTAG protocol, custom FPGA board design, PCB layout, power supply
// design, board bring-up, testing, and final integration of the complete SoC
// on real physical hardware.
// =============================================================================

export const section7 = {
  id: 7,
  title: "Physical: Running on Real Hardware",
  subtitle: "Custom FPGA Board Design and Bring-up",
  duration: "1 week",
  description:
    "Design a custom FPGA development board from scratch, program it over JTAG, and bring up your complete SoC on real physical hardware -- the final step from transistor to working computer.",
  longDescription:
    "This final section bridges the gap between simulation and reality. You will learn the JTAG protocol that lets you program and debug FPGAs, design a complete custom PCB in KiCad with an FPGA, Ethernet PHY, voltage regulators, and oscillator, then bring the board to life by verifying power rails, programming the FPGA over JTAG, testing each peripheral (UART, SD card, Ethernet), and finally loading your full SoC design onto real silicon. This is the culmination of the entire course: watching your CPU execute instructions on actual hardware that you designed from the gate level up.",
  topics: [
    "JTAG Protocol",
    "TAP Controller",
    "Boundary Scan",
    "Bit-Bang Programming",
    "PCB Design",
    "Schematic Capture",
    "4-Layer Stackup",
    "Power Supply Design",
    "Signal Integrity",
    "KiCad",
    "Board Bring-up",
    "Oscilloscope Debugging",
    "Logic Analyzer",
    "Final Integration",
  ],
  learningGoals: [
    "Understand the JTAG protocol: TDI, TDO, TMS, TCK signals and the TAP controller state machine",
    "Explain all 16 states of the TAP controller and how TMS navigates between them",
    "Write a bit-bang JTAG programmer in C that can program an FPGA bitstream",
    "Design a complete FPGA board schematic with power, clocking, and peripheral subsystems",
    "Lay out a 4-layer PCB with proper stackup, decoupling, and signal integrity considerations",
    "Select appropriate components: FPGA, voltage regulators, oscillators, Ethernet PHY, connectors",
    "Perform a systematic board bring-up: power verification, JTAG test, peripheral validation",
    "Use oscilloscopes and logic analyzers to debug hardware issues",
    "Load and verify the full SoC design on physical FPGA hardware",
    "Complete the journey from transistor to working computer on real silicon",
  ],

  // ===========================================================================
  // LESSONS
  // ===========================================================================
  lessons: [
    // -------------------------------------------------------------------------
    // LESSON 1: JTAG Protocol and Bit-Banging
    // -------------------------------------------------------------------------
    {
      id: 1,
      title: "JTAG Protocol and Bit-Banging",
      subtitle: "Programming and debugging FPGAs at the wire level",
      duration: "90 min",
      content: [
        {
          type: "text",
          html: `
<h2>JTAG from First Principles</h2>

<p><strong>JTAG</strong> (Joint Test Action Group, IEEE 1149.1) is a serial
protocol originally designed for testing printed circuit boards after
manufacturing. It has since become the universal interface for programming
FPGAs, flashing microcontrollers, and debugging embedded systems. If you
have ever used an FPGA dev board, the bitstream reached the chip over JTAG.</p>

<h3>Why JTAG Exists</h3>

<p>In the 1980s, as PCBs grew denser and ball-grid-array packages hid their
pins underneath the chip, it became impossible to probe individual pins with
a test needle. The industry needed a way to test connections
<em>electrically</em> without physical access. The solution was
<strong>boundary scan</strong>: a shift register built into every pin of
every chip on the board, all daisy-chained together through a single serial
interface. By shifting test patterns through this chain, you can verify that
every solder joint is good without touching a single pin.</p>

<h3>The Four JTAG Signals</h3>

<p>JTAG uses only four mandatory signals (plus an optional fifth):</p>

<ul>
  <li><strong>TCK</strong> (Test Clock) &mdash; The clock signal. All state
      transitions happen on the rising edge of TCK.</li>
  <li><strong>TMS</strong> (Test Mode Select) &mdash; Controls the TAP state
      machine. Sampled on the rising edge of TCK.</li>
  <li><strong>TDI</strong> (Test Data In) &mdash; Serial data shifted into
      the device. Sampled on the rising edge of TCK.</li>
  <li><strong>TDO</strong> (Test Data Out) &mdash; Serial data shifted out
      of the device. Changes on the falling edge of TCK.</li>
  <li><strong>TRST</strong> (Test Reset, optional) &mdash; Asynchronous reset
      of the TAP controller. Not all devices have this.</li>
</ul>

<p>That is it. Four wires (plus ground) are enough to program a million-gate
FPGA, debug a running ARM processor, or test every connection on a complex
board.</p>

<h3>The TAP Controller State Machine</h3>

<p>The heart of JTAG is the <strong>Test Access Port (TAP) controller</strong>,
a 16-state finite state machine driven entirely by TMS. The current state
determines what happens to the data on TDI and TDO. Every device on the
JTAG chain has its own TAP controller, and they all share the same TCK and
TMS signals.</p>

<p>The key insight: TMS=1 five times in a row always brings you back to
Test-Logic-Reset, no matter where you are. This is the "escape hatch" that
guarantees you can always recover to a known state.</p>

<h3>Two Main Paths</h3>

<p>From the Run-Test/Idle state, you can enter one of two parallel paths:</p>

<ul>
  <li><strong>DR path</strong> (Data Register): Capture-DR, Shift-DR,
      Exit1-DR, Pause-DR, Exit2-DR, Update-DR. This is where you shift
      data in and out of the selected data register (e.g., the boundary
      scan register, or the FPGA configuration register).</li>
  <li><strong>IR path</strong> (Instruction Register): Capture-IR, Shift-IR,
      Exit1-IR, Pause-IR, Exit2-IR, Update-IR. This is where you load
      an instruction that selects which data register subsequent DR
      operations will target.</li>
</ul>

<h3>How FPGA Programming Works Over JTAG</h3>

<p>To program an FPGA via JTAG:</p>

<ol>
  <li>Navigate to Shift-IR and shift in the "PROGRAM" or "CFG_IN" instruction
      (the exact instruction code depends on the FPGA vendor).</li>
  <li>Navigate to Update-IR to latch the instruction.</li>
  <li>Navigate to Shift-DR and shift in the entire bitstream file, one bit
      at a time, through TDI.</li>
  <li>Navigate to Update-DR to commit the configuration.</li>
  <li>The FPGA checks the bitstream CRC. If valid, it exits configuration
      mode and starts running your design.</li>
</ol>

<p>For a typical FPGA with a 2 Mbit bitstream at 10 MHz TCK, programming
takes about 0.2 seconds. At 1 MHz (common for bit-banging), it takes about
2 seconds.</p>
          `,
        },
        {
          type: "diagram",
          content: `TAP Controller State Machine (16 States)
══════════════════════════════════════════

                    ┌──────────────────┐
          ┌────────>│ Test-Logic-Reset │<──── TMS=1 (from any state,
          │         └────────┬─────────┘      5 consecutive TMS=1)
          │                  │ TMS=0
          │         ┌────────▼─────────┐
          │    ┌───>│  Run-Test/Idle   │◄──┐
          │    │    └──┬───────────────┘   │ TMS=0
          │    │       │ TMS=1             │
          │    │  ┌────▼──────┐      ┌────▼──────┐
          │    │  │ Select-DR │      │ Select-IR │
          │    │  └────┬──────┘      └────┬──────┘
          │    │       │ TMS=0     TMS=1  │ TMS=0
          │    │  ┌────▼──────┐      ┌────▼──────┐
          │    │  │Capture-DR │      │Capture-IR │
          │    │  └────┬──────┘      └────┬──────┘
          │    │       │ TMS=0            │ TMS=0
          │    │  ┌────▼──────┐      ┌────▼──────┐
          │    │  │  Shift-DR │◄─┐   │  Shift-IR │◄─┐
          │    │  └────┬──────┘  │   └────┬──────┘  │
          │    │       │ TMS=1   │TMS=0   │ TMS=1   │TMS=0
          │    │  ┌────▼──────┐  │   ┌────▼──────┐  │
          │    │  │  Exit1-DR │──┘   │  Exit1-IR │──┘
          │    │  └────┬──────┘      └────┬──────┘
          │    │       │ TMS=0            │ TMS=0
          │    │  ┌────▼──────┐      ┌────▼──────┐
          │    │  │  Pause-DR │      │  Pause-IR │
          │    │  └────┬──────┘      └────┬──────┘
          │    │       │ TMS=1            │ TMS=1
          │    │  ┌────▼──────┐      ┌────▼──────┐
          │    │  │  Exit2-DR │      │  Exit2-IR │
          │    │  └────┬──────┘      └────┬──────┘
          │    │       │ TMS=1            │ TMS=1
          │    │  ┌────▼──────┐      ┌────▼──────┐
          │    └──│ Update-DR │      │ Update-IR │──┘
          │       └───────────┘      └───────────┘
          │              TMS=1            TMS=1
          └──────────────────────────────────┘

DR Path (left): Shift data in/out of selected data register
IR Path (right): Load instruction to select which data register to use
`,
        },
        {
          type: "table",
          headers: ["State", "TMS=0 Next State", "TMS=1 Next State", "Purpose"],
          rows: [
            ["Test-Logic-Reset", "Run-Test/Idle", "Test-Logic-Reset", "Reset all TAP logic. IDCODE loaded into IR."],
            ["Run-Test/Idle", "Run-Test/Idle", "Select-DR-Scan", "Idle state between operations."],
            ["Select-DR-Scan", "Capture-DR", "Select-IR-Scan", "Entry point to Data Register path."],
            ["Capture-DR", "Shift-DR", "Exit1-DR", "Parallel-load data register from its source."],
            ["Shift-DR", "Shift-DR", "Exit1-DR", "Shift TDI into DR, DR out through TDO. One bit per TCK."],
            ["Exit1-DR", "Pause-DR", "Update-DR", "Transition out of shifting."],
            ["Pause-DR", "Pause-DR", "Exit2-DR", "Pause shifting (for slow hosts)."],
            ["Exit2-DR", "Shift-DR", "Update-DR", "Resume shifting or proceed to update."],
            ["Update-DR", "Run-Test/Idle", "Select-DR-Scan", "Latch shifted data into output register."],
            ["Select-IR-Scan", "Capture-IR", "Test-Logic-Reset", "Entry point to Instruction Register path."],
            ["Capture-IR", "Shift-IR", "Exit1-IR", "Load fixed pattern (01) into IR shift register."],
            ["Shift-IR", "Shift-IR", "Exit1-IR", "Shift instruction in via TDI."],
            ["Exit1-IR", "Pause-IR", "Update-IR", "Transition out of shifting."],
            ["Pause-IR", "Pause-IR", "Exit2-IR", "Pause shifting."],
            ["Exit2-IR", "Shift-IR", "Update-IR", "Resume shifting or proceed to update."],
            ["Update-IR", "Run-Test/Idle", "Select-DR-Scan", "Latch instruction; selects data register for DR path."],
          ],
        },
        {
          type: "code",
          label: "Bit-bang JTAG programmer in C (for USB microcontroller like FT232H)",
          code: `// jtag_bitbang.c -- Minimal JTAG bit-bang programmer
// Targets an FTDI FT232H in MPSSE mode or any GPIO-capable MCU

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// GPIO pin assignments (adjust for your hardware)
#define PIN_TCK  (1 << 0)  // ADBUS0
#define PIN_TDI  (1 << 1)  // ADBUS1
#define PIN_TDO  (1 << 2)  // ADBUS2 (input)
#define PIN_TMS  (1 << 3)  // ADBUS3

// Hardware abstraction -- implement for your platform
void gpio_write(uint8_t pins, uint8_t values);
uint8_t gpio_read(uint8_t pin);
void delay_us(unsigned int us);

// --- Low-level JTAG primitives ---

// Clock one bit through JTAG. Returns TDO value.
static int jtag_clock_bit(int tms, int tdi) {
    uint8_t out = 0;

    // Set TMS and TDI before rising edge
    if (tms) out |= PIN_TMS;
    if (tdi) out |= PIN_TDI;

    gpio_write(PIN_TCK | PIN_TMS | PIN_TDI, out);  // TCK=0
    delay_us(1);

    // Rising edge of TCK -- device samples TMS and TDI
    gpio_write(PIN_TCK | PIN_TMS | PIN_TDI, out | PIN_TCK);
    delay_us(1);

    // Read TDO (changes on falling edge, stable now)
    int tdo = gpio_read(PIN_TDO) ? 1 : 0;

    // Falling edge of TCK
    gpio_write(PIN_TCK | PIN_TMS | PIN_TDI, out);
    delay_us(1);

    return tdo;
}

// --- TAP state machine navigation ---

// Reset TAP: clock TMS=1 five times
void jtag_reset(void) {
    for (int i = 0; i < 5; i++) {
        jtag_clock_bit(1, 0);
    }
    // Now in Test-Logic-Reset
    // Go to Run-Test/Idle
    jtag_clock_bit(0, 0);
}

// Navigate: Run-Test/Idle -> Shift-IR
void jtag_goto_shift_ir(void) {
    jtag_clock_bit(1, 0);  // -> Select-DR-Scan
    jtag_clock_bit(1, 0);  // -> Select-IR-Scan
    jtag_clock_bit(0, 0);  // -> Capture-IR
    jtag_clock_bit(0, 0);  // -> Shift-IR
}

// Navigate: Run-Test/Idle -> Shift-DR
void jtag_goto_shift_dr(void) {
    jtag_clock_bit(1, 0);  // -> Select-DR-Scan
    jtag_clock_bit(0, 0);  // -> Capture-DR
    jtag_clock_bit(0, 0);  // -> Shift-DR
}

// Shift 'nbits' of data in via TDI, capture TDO.
// On the last bit, TMS=1 to exit to Exit1-xR.
// Returns captured TDO data.
uint32_t jtag_shift(const uint8_t *data_in, int nbits) {
    uint32_t data_out = 0;

    for (int i = 0; i < nbits; i++) {
        int tdi = (data_in[i / 8] >> (i % 8)) & 1;
        int tms = (i == nbits - 1) ? 1 : 0;  // Exit on last bit

        int tdo = jtag_clock_bit(tms, tdi);
        if (tdo) data_out |= (1U << i);
    }

    // Now in Exit1-xR. Go to Update-xR, then Run-Test/Idle.
    jtag_clock_bit(1, 0);  // -> Update-xR
    jtag_clock_bit(0, 0);  // -> Run-Test/Idle

    return data_out;
}

// --- High-level JTAG operations ---

// Write an instruction to the IR
void jtag_write_ir(uint32_t instruction, int ir_len) {
    uint8_t buf[4];
    memcpy(buf, &instruction, sizeof(buf));
    jtag_goto_shift_ir();
    jtag_shift(buf, ir_len);
}

// Read the IDCODE register (IR instruction 0x01 on most devices)
uint32_t jtag_read_idcode(int ir_len) {
    uint8_t idcode_instr = 0x01;  // IDCODE instruction
    jtag_write_ir(idcode_instr, ir_len);

    uint8_t zeros[4] = {0};
    jtag_goto_shift_dr();
    return jtag_shift(zeros, 32);
}

// Program an FPGA bitstream
int jtag_program_fpga(const char *bitstream_path,
                      uint8_t cfg_in_instr,
                      int ir_len) {
    FILE *f = fopen(bitstream_path, "rb");
    if (!f) { perror("fopen"); return -1; }

    // Get file size
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    printf("Bitstream: %ld bytes (%ld bits)\\n", size, size * 8);

    // Load CFG_IN instruction
    jtag_write_ir(cfg_in_instr, ir_len);

    // Navigate to Shift-DR
    jtag_goto_shift_dr();

    // Stream the bitstream one byte at a time
    uint8_t byte;
    long bytes_sent = 0;
    while (fread(&byte, 1, 1, f) == 1) {
        for (int bit = 0; bit < 8; bit++) {
            int tdi = (byte >> bit) & 1;
            int last = (bytes_sent == size - 1 && bit == 7);
            jtag_clock_bit(last ? 1 : 0, tdi);
        }
        bytes_sent++;
        if (bytes_sent % 10000 == 0) {
            printf("\\rProgress: %ld / %ld bytes (%.1f%%)",
                   bytes_sent, size,
                   100.0 * bytes_sent / size);
            fflush(stdout);
        }
    }
    printf("\\rProgress: %ld / %ld bytes (100.0%%)\\n",
           bytes_sent, size);

    // Exit to Update-DR, then Run-Test/Idle
    jtag_clock_bit(1, 0);  // -> Update-DR
    jtag_clock_bit(0, 0);  // -> Run-Test/Idle

    fclose(f);
    printf("Programming complete. Check DONE pin.\\n");
    return 0;
}

// --- Main ---
int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <bitstream.bin>\\n", argv[0]);
        return 1;
    }

    // Initialize GPIO (platform-specific)
    // init_gpio();

    printf("Resetting TAP controller...\\n");
    jtag_reset();

    printf("Reading IDCODE...\\n");
    uint32_t idcode = jtag_read_idcode(6);
    printf("IDCODE: 0x%08X\\n", idcode);
    printf("  Manufacturer: 0x%03X\\n", (idcode >> 1) & 0x7FF);
    printf("  Part Number:  0x%04X\\n", (idcode >> 12) & 0xFFFF);
    printf("  Version:      0x%01X\\n", (idcode >> 28) & 0xF);

    printf("Programming FPGA...\\n");
    // CFG_IN instruction varies by vendor:
    // Xilinx 7-series: 0x05, Lattice ECP5: 0x26, etc.
    jtag_program_fpga(argv[1], 0x05, 6);

    return 0;
}`,
        },
        {
          type: "text",
          html: `
<h3>JTAG is LSB-First: Why the Bit Indexing Looks That Way</h3>

<p>JTAG shifts data <strong>least-significant bit first</strong> (LSB-first).
When you load an 8-bit instruction like <code>0x26</code> (binary
<code>00100110</code>), bit 0 (the &lsquo;0&rsquo; on the right) goes out on
TDI first, then bit 1, and so on up to bit 7.</p>

<p>This is why the bit-bang code accesses bits with the expression
<code>(data_in[i/8] &gt;&gt; (i%8)) &amp; 1</code>:</p>

<ul>
  <li><code>i/8</code> selects the correct <em>byte</em> from the data buffer
      (byte 0 first, then byte 1, etc.).</li>
  <li><code>i%8</code> selects the correct <em>bit within that byte</em>,
      starting from bit 0 (the least significant bit).</li>
  <li>The right-shift and mask (<code>&gt;&gt;</code> and <code>&amp; 1</code>)
      extract that single bit.</li>
</ul>

<p>So for byte <code>0x26 = 0b00100110</code>, the bits go out on TDI in
order: 0, 1, 1, 0, 0, 1, 0, 0. The receiver&rsquo;s shift register fills from
LSB to MSB, reconstructing the original value. This LSB-first convention is
mandated by IEEE 1149.1 and ensures that the first bit shifted in ends up in
bit position 0 of the instruction or data register.</p>

<p>A practical consequence: if you capture JTAG traffic on a logic analyzer,
the bits appear to arrive &ldquo;backwards&rdquo; compared to how you would
normally write the hex value. Keep this in mind when debugging.</p>
`,
        },
        {
          type: "code",
          label: "FTDI FT232H initialization using libftdi (concrete setup snippet)",
          code: `// ftdi_jtag_init.c -- Initialize an FTDI FT232H for JTAG bit-banging
// Requires: libftdi1-dev (apt install libftdi1-dev)
// Compile: gcc -o ftdi_jtag_init ftdi_jtag_init.c -lftdi1

#include <stdio.h>
#include <stdlib.h>
#include <ftdi.h>

// FT232H pin mapping on ADBUS:
//   ADBUS0 = TCK (output)
//   ADBUS1 = TDI (output)
//   ADBUS2 = TDO (input)
//   ADBUS3 = TMS (output)
// Direction bitmask: bit=1 means output
#define DIR_MASK  0x0B   // 0b00001011 = TCK, TDI, TMS as outputs
#define INIT_VAL  0x08   // 0b00001000 = TMS=1 (idle high), TCK=0, TDI=0

struct ftdi_context *ftdi_jtag_open(void) {
    struct ftdi_context *ftdi = ftdi_new();
    if (!ftdi) {
        fprintf(stderr, "ftdi_new() failed\\n");
        return NULL;
    }

    // Open the FT232H by VID/PID
    if (ftdi_usb_open(ftdi, 0x0403, 0x6014) < 0) {
        fprintf(stderr, "ftdi_usb_open: %s\\n", ftdi_get_error_string(ftdi));
        ftdi_free(ftdi);
        return NULL;
    }

    // Reset the device
    ftdi_usb_reset(ftdi);

    // Set bitbang mode on ADBUS pins
    // BITMODE_BITBANG = 0x01 for synchronous bit-bang
    if (ftdi_set_bitmode(ftdi, DIR_MASK, BITMODE_BITBANG) < 0) {
        fprintf(stderr, "ftdi_set_bitmode: %s\\n", ftdi_get_error_string(ftdi));
        ftdi_usb_close(ftdi);
        ftdi_free(ftdi);
        return NULL;
    }

    // Set baud rate -- actual bit-bang clock = baud * 16
    // 9600 baud -> ~150 kHz toggle rate -> ~75 kHz TCK
    // For faster JTAG, use MPSSE mode instead of bitbang
    ftdi_set_baudrate(ftdi, 9600);

    // Write initial pin state: TMS=1, TCK=0, TDI=0
    unsigned char init = INIT_VAL;
    ftdi_write_data(ftdi, &init, 1);

    printf("FT232H opened for JTAG bit-bang.\\n");
    printf("  TCK=ADBUS0, TDI=ADBUS1, TDO=ADBUS2, TMS=ADBUS3\\n");
    return ftdi;
}

// Implement gpio_write/gpio_read using this ftdi context:
static struct ftdi_context *g_ftdi;

void gpio_write(uint8_t pins, uint8_t values) {
    // Read current state, mask out the pins we are setting, apply new values
    static uint8_t current = INIT_VAL;
    current = (current & ~pins) | (values & pins);
    ftdi_write_data(g_ftdi, &current, 1);
}

uint8_t gpio_read(uint8_t pin) {
    unsigned char buf;
    ftdi_read_pins(g_ftdi, &buf);
    return buf & pin;
}

void delay_us(unsigned int us) {
    // In bitbang mode, the USB latency (~1ms) dominates.
    // For precise timing, use MPSSE mode instead.
    (void)us;
}

int main(void) {
    g_ftdi = ftdi_jtag_open();
    if (!g_ftdi) return 1;

    // Now you can call jtag_reset(), jtag_read_idcode(), etc.
    // from the earlier bit-bang code, using these gpio functions.

    printf("Ready. Use jtag_reset() + jtag_read_idcode() to test.\\n");

    ftdi_set_bitmode(g_ftdi, 0, BITMODE_RESET);
    ftdi_usb_close(g_ftdi);
    ftdi_free(g_ftdi);
    return 0;
}`,
        },
        {
          type: "info",
          variant: "tip",
          title: "The Five-TMS-1 Rule",
          html: "No matter what state the TAP controller is in, clocking TMS=1 for five consecutive TCK cycles will always bring it back to Test-Logic-Reset. This is the most important debugging trick in JTAG: if you ever get lost, just clock five ones and you are back to a known state. This is why the protocol is so robust -- you can never permanently lose synchronization.",
        },
        {
          type: "info",
          variant: "info",
          title: "JTAG Chain (Daisy-Chaining)",
          html: "Multiple devices on a board share TMS and TCK but their TDI/TDO pins are daisy-chained: TDO of device 1 connects to TDI of device 2, and so on. To address a specific device, you shift the correct IR length for each device in the chain. Devices you want to bypass get the BYPASS instruction (all 1s), which inserts a single-bit pass-through register.",
        },
        {
          type: "table",
          headers: ["JTAG Instruction", "Typical Opcode", "Data Register Selected", "Purpose"],
          rows: [
            ["BYPASS", "All 1s", "1-bit bypass register", "Pass through chain with minimal delay"],
            ["IDCODE", "Vendor-specific (often 0x01)", "32-bit ID register", "Read device identification"],
            ["SAMPLE/PRELOAD", "Vendor-specific", "Boundary scan register", "Capture/set pin states without disrupting device"],
            ["EXTEST", "Vendor-specific (often 0x00)", "Boundary scan register", "Drive pin values for board-level testing"],
            ["CFG_IN (FPGA)", "Vendor-specific", "Configuration register", "Shift in FPGA bitstream data"],
            ["USERCODE", "Vendor-specific", "32-bit user register", "Read user-programmed identification"],
          ],
        },
        {
          type: "video",
          id: "PhaqHKyAvR4",
          title: "EEVblog -- JTAG Boundary Scan Explained",
        },
        {
          type: "resources",
          links: [
            {
              type: "Specification",
              title: "IEEE 1149.1 (JTAG) Standard Overview",
              url: "https://standards.ieee.org/standard/1149_1-2013.html",
              desc: "The official IEEE standard for boundary scan and JTAG.",
            },
            {
              type: "Tutorial",
              title: "JTAG - A Technical Overview (XJTAG)",
              url: "https://www.xjtag.com/about-jtag/jtag-a-technical-overview/",
              desc: "Clear explanation of the JTAG protocol, TAP controller, and boundary scan.",
            },
            {
              type: "Code",
              title: "OpenOCD -- Open On-Chip Debugger",
              url: "https://openocd.org/",
              desc: "The standard open-source JTAG debugger/programmer. Great source code to study.",
            },
            {
              type: "Tutorial",
              title: "FTDI MPSSE Basics (AN_135)",
              url: "https://ftdichip.com/wp-content/uploads/2020/08/AN_135_MPSSE_Basics.pdf",
              desc: "Application note for using FTDI chips as JTAG adapters.",
            },
            {
              type: "Tutorial",
              title: "Boundary Scan Tutorial (ASSET InterTech)",
              url: "https://www.asset-intertech.com/resources/boundary-scan-tutorial",
              desc: "Comprehensive tutorial on boundary scan testing of PCBs.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- JTAG Protocol",
          items: [
            "<strong>TAP state machine simulator:</strong> Write a program that takes a sequence of TMS bits (e.g., '1 1 0 1 0 0') and prints the TAP state after each clock cycle. Verify that five consecutive TMS=1 always reaches Test-Logic-Reset.",
            "<strong>JTAG waveform decoder:</strong> Given a timing diagram (TCK, TMS, TDI, TDO as arrays of 0s and 1s), write a program that decodes the JTAG transaction: identify the TAP states traversed, extract the IR instruction loaded, and extract the DR data shifted in/out.",
            "<strong>IDCODE reader:</strong> If you have an FTDI-based JTAG adapter (FT232H, Bus Blaster, etc.), use your bit-bang code to read the IDCODE from a real FPGA or microcontroller. Parse the manufacturer ID using the JEDEC JEP106 table.",
            "<strong>Bit-bang programmer:</strong> Extend the provided code to program a real FPGA. Start with a simple bitstream (e.g., blink an LED) and verify the DONE pin goes high after programming completes.",
            "<strong>JTAG chain scanner:</strong> Write a program that scans a JTAG chain of unknown length by shifting 1s through and counting how many TCK cycles it takes for the 1 to appear on TDO. Report how many devices are in the chain and each device's IDCODE.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 2: Designing a Custom FPGA Board
    // -------------------------------------------------------------------------
    {
      id: 2,
      title: "Designing a Custom FPGA Board",
      subtitle: "From schematic to PCB layout in KiCad",
      duration: "120 min",
      content: [
        {
          type: "text",
          html: `
<h2>PCB Design from First Principles</h2>

<p>Until now, your FPGA design has lived in simulation or on a commercial
development board. To truly own the entire stack from transistor to computer,
you need to design your own board. This is the hardware equivalent of writing
your own operating system: you choose every component, route every trace, and
take responsibility for every millivolt.</p>

<h3>The PCB Design Flow</h3>

<p>Designing a PCB follows a well-defined pipeline:</p>

<ol>
  <li><strong>Requirements:</strong> What must the board do? (Run our FPGA SoC
      with UART, SD card, Ethernet, JTAG programming header.)</li>
  <li><strong>Component Selection:</strong> Choose specific parts: FPGA,
      voltage regulators, oscillator, Ethernet PHY, connectors, passives.</li>
  <li><strong>Schematic Capture:</strong> Draw the logical connections between
      components using a schematic editor (KiCad Eeschema).</li>
  <li><strong>Footprint Assignment:</strong> Map each schematic symbol to a
      physical package footprint (QFP, BGA, 0402, etc.).</li>
  <li><strong>PCB Layout:</strong> Place components on the board and route
      copper traces between pads (KiCad Pcbnew).</li>
  <li><strong>Design Rule Check (DRC):</strong> Verify no violations: minimum
      trace width, clearance, drill sizes, etc.</li>
  <li><strong>Generate Gerber files:</strong> The industry-standard format
      sent to the PCB fabrication house.</li>
  <li><strong>Order and assemble:</strong> Fab the board, order components,
      solder (or have assembled by a PCBA service).</li>
</ol>

<h3>Component Selection</h3>

<p>Our FPGA board needs these subsystems:</p>

<h4>1. FPGA</h4>

<p>For a course project, a good choice is a <strong>Lattice ECP5</strong>
(LFE5U-25F or LFE5U-45F) or a <strong>Xilinx Spartan-7</strong>. The ECP5
is particularly attractive because it has a fully open-source toolchain
(Yosys + nextpnr + Project Trellis), keeping with the "from scratch"
philosophy. The LFE5U-25F in a CABGA256 package provides 24K LUTs, plenty
for our SoC, and is available in a 256-ball BGA with 0.8mm pitch.</p>

<h4>2. Power Supply</h4>

<p>FPGAs need multiple voltage rails. A typical ECP5 requires:</p>

<ul>
  <li><strong>VCCIO</strong> (3.3V) &mdash; I/O bank supply. Powers the pin
      drivers and receivers.</li>
  <li><strong>VCC</strong> (1.1V) &mdash; Core logic supply. The FPGA fabric
      runs at this voltage.</li>
  <li><strong>VCCAUX</strong> (2.5V) &mdash; Auxiliary supply for PLLs,
      configuration logic, and JTAG.</li>
</ul>

<p>Each rail needs its own voltage regulator. For a USB-powered board
(5V input), a typical design uses three low-dropout (LDO) regulators or
a combination of a switching regulator (for efficiency on the high-current
1.1V core rail) and LDOs for the lower-current rails.</p>

<h4>Power Sequencing: Why Order Matters</h4>

<p>FPGAs are extremely sensitive to the <strong>order</strong> in which their
power rails come up. The ECP5 datasheet specifies: <strong>VCC (1.1V core)
must be stable before or simultaneously with VCCIO (3.3V)</strong>. The
auxiliary rail VCCAUX (2.5V) should come up after VCC but before VCCIO, or
simultaneously with VCC. The recommended sequence is:</p>

<ol>
  <li><strong>VCC (1.1V)</strong> &mdash; core supply first</li>
  <li><strong>VCCAUX (2.5V)</strong> &mdash; auxiliary supply second</li>
  <li><strong>VCCIO (3.3V)</strong> &mdash; I/O supply last</li>
</ol>

<p><strong>What happens if you violate this?</strong> If VCCIO comes up while
VCC is still at zero, the I/O pin protection diodes can forward-bias into the
unpowered core, injecting current into the core logic. This causes
<strong>latch-up</strong>: a parasitic thyristor structure inside the CMOS
silicon turns on and creates a low-impedance path from the supply rail to
ground. Latch-up draws massive current (amps) and can permanently destroy
the FPGA within milliseconds. Even if latch-up does not occur, the
I/O pins may exceed their <strong>absolute maximum ratings</strong> &mdash;
the datasheet specifies that VCCIO must not exceed VCC + 0.5V. Violating
this stresses the oxide layers and degrades the device over time, even if
it appears to work initially.</p>

<p>In our design, sequencing is handled by connecting the <code>EN</code>
(enable) pins of the 2.5V and 3.3V regulators to the output of the
previous regulator in the chain. The 1.1V regulator is always enabled, the
2.5V regulator enables when VCC is stable, and the 3.3V regulator enables
when VCCAUX is stable. This costs nothing extra &mdash; just a few traces
&mdash; and protects a $10-$50 FPGA from destruction.</p>

<h4>3. Clock Source</h4>

<p>A crystal oscillator provides the reference clock. A 25 MHz or 50 MHz
oscillator is typical. The FPGA's internal PLL can multiply this up to
whatever frequency your SoC needs (e.g., 50 MHz system clock from a
25 MHz input). Use a 3.3V CMOS oscillator in a standard 2.5x2.0mm or
3.2x2.5mm package.</p>

<h4>4. JTAG Programming Header</h4>

<p>A simple 2x5 or 1x6 pin header exposing TCK, TMS, TDI, TDO, and GND.
This connects to your JTAG programmer (FTDI adapter, Bus Blaster, etc.)
for loading bitstreams.</p>

<h4>5. Peripherals</h4>

<ul>
  <li><strong>UART:</strong> An FTDI FT232R or CH340G USB-to-serial chip,
      or just a pin header for connecting an external USB-serial adapter.</li>
  <li><strong>SD Card:</strong> A micro-SD card slot connected to FPGA I/O
      pins for SPI-mode access.</li>
  <li><strong>Ethernet:</strong> An Ethernet PHY chip (e.g., Microchip
      LAN8720A) connected to the FPGA via RMII, plus an RJ45 jack with
      integrated magnetics.</li>
  <li><strong>LEDs:</strong> A few LEDs for debugging (active low, with
      330-ohm series resistors).</li>
  <li><strong>Reset button:</strong> Connected to the FPGA's PROGRAMN pin
      with debounce capacitor.</li>
</ul>

<h4>6. SPI Configuration Flash</h4>

<p>When you program an FPGA over JTAG, the bitstream is stored in volatile
SRAM &mdash; it is lost on power-off. For the FPGA to boot autonomously
(without a JTAG adapter), you need a <strong>SPI flash chip</strong> that
holds the bitstream and feeds it to the FPGA at power-on.</p>

<p><strong>Boot mode pins:</strong> The ECP5 has configuration mode pins
(CFG0, CFG1, CFG2) that tell it where to load its bitstream from. For SPI
flash boot, set CFG[2:0] = <code>001</code> (pull CFG0 high, CFG1 and CFG2
low with 10k resistors). The FPGA will act as a SPI master and read the
bitstream from the flash chip starting at address 0x000000.</p>

<p><strong>How it works at power-on:</strong> After all power rails are stable
and the PROGRAMN pin is released (high), the FPGA samples the CFG pins,
enters Master SPI mode, drives the SPI clock (CCLK), asserts chip-select
(CSSPIN), and reads the bitstream from flash over MISO (DI pin on flash).
The entire bitstream (~600KB for ECP5-25F) loads in about 50ms at the
default 2.4 MHz SPI clock. Once the bitstream is loaded and the CRC checks
pass, the FPGA enters user mode and starts executing your design.</p>

<p><strong>Programming the flash:</strong> You have two options:</p>
<ul>
  <li><strong>Via JTAG:</strong> Tools like <code>ecpprog</code> can program
      the SPI flash <em>through</em> the FPGA by using the JTAG-to-SPI
      bridge built into the ECP5. Command: <code>ecpprog -S bitstream.bit</code>
      (the <code>-S</code> flag targets the SPI flash instead of SRAM).</li>
  <li><strong>Direct SPI:</strong> Connect a SPI programmer (or a second FTDI
      adapter) directly to the flash chip. This is useful if the FPGA is
      not responding over JTAG.</li>
</ul>

<p>A 32 Mbit (4 MB) flash like the W25Q32JV is sufficient for even the
largest ECP5 bitstreams, with room for multiple bitstream images or
user data.</p>

<h3>The Schematic</h3>

<p>In KiCad's schematic editor (Eeschema), you draw the logical connections.
The schematic is organized into sheets, typically one per subsystem:</p>

<ul>
  <li>Sheet 1: FPGA and its decoupling capacitors</li>
  <li>Sheet 2: Power supply (regulators, input protection)</li>
  <li>Sheet 3: JTAG and configuration</li>
  <li>Sheet 4: Peripherals (UART, SD, Ethernet, LEDs)</li>
</ul>

<h3>Reading the FPGA Datasheet for Pin Assignments</h3>

<p>One of the most important skills in FPGA board design is extracting pin
information from the datasheet. Here is how to navigate it:</p>

<p><strong>The ball map (pinout diagram):</strong> For BGA packages, the
datasheet contains a grid showing every ball position (e.g., A1, B2, P16).
Each ball is labeled with its function: user I/O pins are labeled with names
like <code>PL2A</code> (meaning: <strong>P</strong>rimary bank,
<strong>L</strong>eft side, pair <strong>2</strong>, pin <strong>A</strong>
of the differential pair). Power balls are labeled VCC, VCCIO, GND, etc.
Dedicated pins like TCK, TMS, TDI, TDO, PROGRAMN have fixed positions that
you cannot change.</p>

<p><strong>I/O banks:</strong> The FPGA&rsquo;s user I/O pins are organized
into <strong>banks</strong> (numbered 0-8 on ECP5). Each bank has its own
VCCIO supply, meaning all pins in that bank operate at whatever voltage you
connect to that bank&rsquo;s VCCIO pin. This is critical: if your Ethernet
PHY uses 3.3V I/O and your SD card also uses 3.3V, put them in the same bank
(or banks powered at the same voltage). If you need mixed voltages (e.g.,
1.8V for DDR3), use a separate bank with its own VCCIO supply set to 1.8V.
Check the &ldquo;Pin Assignment&rdquo; table in the datasheet, which lists
every pin, its ball position, its bank number, and its capabilities
(input-only, differential-capable, global clock input, etc.).</p>

<p><strong>Special pin categories to watch for:</strong></p>
<ul>
  <li><strong>Global clock inputs (GCLKx):</strong> Only certain pins can
      drive the FPGA&rsquo;s clock network. Your oscillator must connect to
      one of these.</li>
  <li><strong>Differential pairs:</strong> Pins come in true/complement pairs
      for LVDS signaling. Even if you use them single-ended, be aware of
      the pairing.</li>
  <li><strong>Configuration pins (CFG, CCLK, CSSPIN):</strong> Dual-purpose
      pins used during configuration that become user I/O after boot. Be
      careful connecting peripherals to these &mdash; they have specific
      behavior during power-up.</li>
</ul>

<h3>Decoupling Capacitors: The Most Important Passives</h3>

<p>Every power pin on the FPGA needs a <strong>decoupling capacitor</strong>
placed as close to the pin as possible. When the FPGA's internal logic
switches, it draws sudden bursts of current. Without decoupling caps, the
voltage rail would sag and the chip would malfunction. A typical FPGA
needs 20-40 decoupling capacitors (100nF ceramic, 0402 package), plus a
few bulk capacitors (10uF) near each regulator output.</p>

<p>Why 100nF? At the switching frequencies inside an FPGA (tens to hundreds
of MHz), a 100nF ceramic capacitor has very low impedance due to its
small physical size and low parasitic inductance. The formula
<code>Z = 1 / (2 * pi * f * C)</code> gives about 0.03 ohms at 50 MHz
for a 100nF cap.</p>

<h3>4-Layer PCB Stackup</h3>

<p>For an FPGA board, a 4-layer PCB is the minimum practical choice. The
standard stackup is:</p>
          `,
        },
        {
          type: "diagram",
          content: `Complete FPGA Board Block Diagram
═══════════════════════════════════

                     USB 5V
                       │
                ┌──────▼──────┐
                │  Input      │
                │  Protection │
                │  (TVS, fuse)│
                └──────┬──────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
    │  LDO/Buck │ │  LDO  │ │    LDO    │
    │   1.1V    │ │  2.5V │ │    3.3V   │
    │  (Core)   │ │ (Aux) │ │   (I/O)   │
    └─────┬─────┘ └───┬───┘ └─────┬─────┘
          │           │           │
          └─────┬─────┘     ┌─────┘
                │           │
          ┌─────▼───────────▼─────┐
          │                       │
          │      FPGA             │
          │   (Lattice ECP5      │
          │    or Xilinx S7)     │    25/50 MHz
          │                       │◄──── Oscillator
          │                       │
          └─┬───┬───┬───┬───┬───┬─┘
            │   │   │   │   │   │
            │   │   │   │   │   │
     ┌──────┘   │   │   │   │   └──────┐
     │          │   │   │   │          │
  ┌──▼──┐  ┌───▼┐ ┌▼───▼┐ ┌▼──┐  ┌────▼────┐
  │JTAG │  │UART│ │SD   │ │LED│  │Ethernet │
  │HDR  │  │/USB│ │Card │ │x4 │  │PHY+RJ45 │
  │2x5  │  │Ser │ │Slot │ │   │  │LAN8720A │
  └─────┘  └────┘ └─────┘ └───┘  └─────────┘


4-Layer PCB Stackup
═══════════════════

    ┌─────────────────────────────────┐
    │  Layer 1 (Top): Signal + Components  │  35um copper
    ├─────────────────────────────────┤
    │  Prepreg (dielectric)                │  ~0.2mm
    ├─────────────────────────────────┤
    │  Layer 2 (Inner): Ground Plane       │  35um copper
    ├─────────────────────────────────┤
    │  Core (dielectric)                   │  ~1.0mm
    ├─────────────────────────────────┤
    │  Layer 3 (Inner): Power Plane        │  35um copper
    ├─────────────────────────────────┤
    │  Prepreg (dielectric)                │  ~0.2mm
    ├─────────────────────────────────┤
    │  Layer 4 (Bottom): Signal + Components│  35um copper
    └─────────────────────────────────┘

    Total board thickness: ~1.6mm (standard)

    Why this order?
    - Ground plane directly under top signal layer gives
      controlled impedance and short return paths
    - Power plane directly above bottom signal layer
      does the same for bottom-side traces
    - The inner ground plane also acts as a shield between
      top and bottom signal layers
`,
        },
        {
          type: "table",
          headers: ["Component", "Example Part", "Package", "Purpose"],
          rows: [
            ["FPGA", "Lattice LFE5U-25F-6BG256", "CABGA256 (0.8mm pitch)", "Main logic: runs your SoC design"],
            ["Core Regulator", "TLV62569 (switching) or AMS1117-1.1", "SOT-23-5 / SOT-223", "1.1V core supply, ~500mA"],
            ["Aux Regulator", "AP2112K-2.5", "SOT-23-5", "2.5V auxiliary supply, ~100mA"],
            ["I/O Regulator", "AMS1117-3.3 or AP2112K-3.3", "SOT-223 / SOT-23-5", "3.3V I/O supply, ~300mA"],
            ["Oscillator", "SIT8008BI-25-33E (25 MHz)", "2.5x2.0mm SMD", "Reference clock for FPGA PLLs"],
            ["Ethernet PHY", "Microchip LAN8720A", "QFN-24 (4x4mm)", "10/100 Ethernet via RMII interface"],
            ["RJ45 Jack", "HR911105A (w/ magnetics)", "Through-hole", "Ethernet connector with integrated transformer"],
            ["USB-Serial", "CH340G or FTDI FT232RL", "SOP-16 / SSOP-28", "UART bridge for console access"],
            ["SD Card Slot", "Molex 104031-0811", "SMD micro-SD", "SPI-mode storage for filesystem"],
            ["Decoupling Caps", "100nF MLCC (x30-40)", "0402", "Local charge reservoir for every power pin"],
            ["Bulk Caps", "10uF MLCC (x3-6)", "0805", "Bulk energy storage near each regulator"],
            ["Configuration Flash", "W25Q32JVSSIQ (32Mbit)", "SOIC-8", "Stores FPGA bitstream for autonomous boot"],
          ],
        },
        {
          type: "code",
          label: "KiCad schematic snippet: FPGA power and decoupling (as netlist excerpt)",
          code: `# KiCad Schematic Notes -- FPGA Power Section
# This is pseudo-schematic notation showing the key connections

# === Power Input ===
# USB_VBUS (5V) -> Schottky diode -> Bulk cap (47uF) -> Regulators

# === 3.3V Rail (I/O) ===
# AMS1117-3.3:
#   IN  <- USB_5V (via Schottky)
#   GND <- GND
#   OUT -> VCC3V3 net
#   OUT -> 10uF ceramic (close to output)
#   IN  -> 10uF ceramic (close to input)

# === 2.5V Rail (Aux) ===
# AP2112K-2.5:
#   VIN <- USB_5V
#   GND <- GND
#   VOUT -> VCC2V5 net
#   EN  <- VCC3V3 (enable after 3.3V is stable)
#   VOUT -> 10uF ceramic
#   VIN  -> 10uF ceramic

# === 1.1V Rail (Core) ===
# TLV62569DBVR (switching regulator for efficiency):
#   VIN  <- USB_5V
#   GND  <- GND
#   SW   -> 4.7uH inductor -> VCC1V1 net
#   FB   <- resistor divider from VCC1V1
#   EN   <- VCC3V3
#   VCC1V1 -> 22uF ceramic output cap
#   VIN    -> 10uF ceramic input cap

# === FPGA Decoupling ===
# For EACH VCC pin on the FPGA:
#   Place 100nF 0402 cap between VCC pin and nearest GND via
#   Keep trace length under 3mm

# FPGA Pin Assignments (Lattice ECP5 LFE5U-25F-6BG256):
# Power pins (directly from schematic symbol):
#   VCC     (1.1V): pins A3, B14, D8, F1, G16, K8, ...
#   VCCIO0  (3.3V): pins B4, C3
#   VCCIO1  (3.3V): pins A14, B15
#   VCCIO2  (3.3V): pins R14, T15
#   VCCIO3  (3.3V): pins T4, R3
#   VCCIO6  (3.3V): pins H1, J2
#   VCCIO7  (3.3V): pins H16, J15
#   VCCAUX  (2.5V): pins F16, H7, J8

# === Configuration / JTAG ===
# JTAG Header (2x5, 1.27mm pitch):
#   Pin 1: TCK  -> FPGA TCK (ball T5)
#   Pin 2: GND
#   Pin 3: TDO  -> FPGA TDO (ball N6)
#   Pin 4: VCC3V3 (target voltage reference)
#   Pin 5: TMS  -> FPGA TMS (ball R5)
#   Pin 7: TDI  -> FPGA TDI (ball M5)
#   Pin 9: TRST -> FPGA PROGRAMN (active low, active = reconfigure)
#
# Pull-ups: 4.7k to VCC3V3 on TMS, TDI
# Pull-down: 4.7k to GND on TCK (prevent floating clock)

# === Oscillator ===
# 25 MHz CMOS oscillator:
#   VDD <- VCC3V3 (via ferrite bead for noise isolation)
#   GND <- GND
#   OUT -> FPGA clock input pin (with series 33-ohm resistor)
#   100nF decoupling cap on VDD`,
        },
        {
          type: "text",
          html: `
<h3>PCB Layout Guidelines for FPGA Boards</h3>

<h4>Signal Integrity Basics</h4>

<p>At the frequencies inside an FPGA board (25-100+ MHz), PCB traces are
not just wires -- they are <strong>transmission lines</strong>. A signal
propagating down a trace has a characteristic impedance determined by the
trace width, the distance to the reference plane, and the dielectric
constant of the PCB material:</p>

<p><code>Z0 = 87 / sqrt(Er + 1.41) * ln(5.98 * H / (0.8 * W + T))</code></p>

<p>where Er is the dielectric constant (~4.4 for FR-4), H is the distance
to the reference plane, W is the trace width, and T is the copper
thickness. For a typical 4-layer board with 0.2mm prepreg, a 0.15mm wide
trace gives approximately 50 ohms impedance.</p>

<p><strong>Intuition for the impedance formula:</strong> You do not need to
memorize the equation, but understanding what each parameter does will help
you make good layout decisions:</p>

<ul>
  <li><strong>Wider traces (larger W) = lower impedance.</strong> A wider
      trace has more capacitance to the ground plane (like widening the
      plates of a capacitor). More capacitance per unit length lowers the
      characteristic impedance. This is why power traces are wide &mdash;
      you want low impedance to deliver current easily.</li>
  <li><strong>Closer to the ground plane (smaller H) = lower impedance.</strong>
      Moving the trace closer to its reference plane increases the
      capacitance (same as moving capacitor plates closer together). It
      also reduces the loop area for return current, which reduces
      inductance. Both effects lower impedance.</li>
  <li><strong>Higher dielectric constant (larger Er) = lower impedance.</strong>
      A &ldquo;better&rdquo; insulator between the trace and ground plane
      stores more electric field energy, increasing capacitance and lowering
      impedance. FR-4 has Er &asymp; 4.4; air would be 1.0.</li>
  <li><strong>Thicker copper (larger T) = slightly lower impedance.</strong>
      The effect is small compared to W and H, but thicker copper
      increases the effective width slightly.</li>
</ul>

<p>The practical takeaway: if your impedance is too high, make the trace
wider or use a thinner prepreg layer. If it is too low, make the trace
narrower. Most PCB fabricators provide an online impedance calculator
where you enter your stackup dimensions and it tells you the exact trace
width needed for 50 ohms.</p>

<p>If the impedance changes along a trace (e.g., at a via, a width change,
or a connector), part of the signal reflects back. These
<strong>reflections</strong> cause ringing, overshoot, and potentially
false logic transitions. For signals above ~50 MHz, you need to maintain
controlled impedance and consider termination resistors.</p>

<h4>Return Paths</h4>

<p>Every signal needs a <strong>return path</strong>. For high-frequency
signals on a microstrip (trace over ground plane), the return current flows
directly underneath the trace on the ground plane. If the ground plane has
a slot or gap, the return current must detour around it, creating a loop
antenna that radiates EMI and picks up noise. Rule: <strong>never cut
slots in the ground plane under signal traces</strong>.</p>

<h4>Layout Priority Order</h4>

<ol>
  <li><strong>Decoupling capacitors first:</strong> Place all FPGA decoupling
      caps before anything else. They must be as close to the power pins as
      physically possible, with short, wide traces to the power/ground
      planes via short vias.</li>
  <li><strong>Clock signals:</strong> Route clock traces first. Keep them
      short, avoid vias, match lengths if there are differential pairs,
      and keep them away from other signals.</li>
  <li><strong>High-speed buses:</strong> Route RMII (Ethernet), SDIO/SPI
      (SD card) next. Match trace lengths within a bus to within 1-2mm.</li>
  <li><strong>Everything else:</strong> JTAG, LEDs, reset, UART. These are
      low-speed and forgiving.</li>
</ol>

<h4>The RMII Interface (Reduced Media Independent Interface)</h4>

<p>Since our board includes an Ethernet PHY (LAN8720A), you need to
understand <strong>RMII</strong> &mdash; the interface between the FPGA
(acting as the MAC) and the PHY chip. RMII uses only 7 signals, making it
much simpler to route than the full MII (which needs 16):</p>

<ul>
  <li><strong>REF_CLK</strong> (50 MHz) &mdash; A shared reference clock
      that both the MAC and PHY use. Can be sourced by the PHY, an external
      oscillator, or the FPGA. All data transfers are synchronous to this
      clock.</li>
  <li><strong>TX_EN</strong> &mdash; Transmit enable. The MAC asserts this
      to tell the PHY that valid data is on the TXD lines.</li>
  <li><strong>TXD[1:0]</strong> &mdash; Two transmit data bits per clock
      cycle. At 50 MHz with 2-bit data, the throughput is 100 Mbit/s
      (matching 100BASE-TX Ethernet).</li>
  <li><strong>RXD[1:0]</strong> &mdash; Two receive data bits per clock
      cycle from the PHY to the MAC.</li>
  <li><strong>CRS_DV</strong> &mdash; Carrier Sense / Data Valid. The PHY
      asserts this when it is receiving valid data. It multiplexes two MII
      signals (CRS and RX_DV) onto one pin by toggling between them on
      alternate nibble boundaries.</li>
</ul>

<p>When routing RMII, keep the traces short (under 50mm), length-matched
to within 2mm of each other, and referenced to the ground plane. The 50 MHz
REF_CLK is the most timing-critical signal &mdash; ensure it arrives at
both the FPGA and PHY pins with minimal skew.</p>

<h4>BGA Fanout</h4>

<p>If your FPGA is in a BGA package, you need to "fan out" the inner ball
pads to traces that can reach the rest of the board. The standard technique
for 0.8mm pitch BGA:</p>

<ul>
  <li>Outer two rows: route traces directly on the top layer.</li>
  <li>Inner rows: use vias to drop down to inner or bottom layers.</li>
  <li>Via size: 0.3mm drill, 0.6mm pad (check your fab's capabilities).</li>
  <li>Dog-bone fanout: short trace from pad to via, placed between pads.</li>
</ul>
          `,
        },
        {
          type: "info",
          variant: "warning",
          title: "BGA Soldering at Home",
          html: "BGA packages cannot be hand-soldered with a regular iron. You need either a reflow oven (a modified toaster oven with a temperature controller works surprisingly well for prototypes), a hot air rework station, or a PCBA assembly service. For a first board, consider using a TQFP or QFP packaged FPGA instead -- they can be hand-soldered with flux, a fine-tip iron, and patience. The Lattice ECP5 is also available in TQFP-144, though with fewer I/O pins.",
        },
        {
          type: "text",
          html: `
<h3>Generating Gerber Files for Fabrication</h3>

<p>Once your PCB layout passes DRC (Design Rule Check), you need to export
<strong>Gerber files</strong> &mdash; the industry-standard format that every
PCB fabricator accepts. In KiCad, go to <em>File &gt; Plot</em> in the PCB
editor. You need to export these layers:</p>

<ol>
  <li><strong>F.Cu</strong> (Front Copper) &mdash; Top signal layer</li>
  <li><strong>In1.Cu</strong> (Inner Copper 1) &mdash; Ground plane</li>
  <li><strong>In2.Cu</strong> (Inner Copper 2) &mdash; Power plane</li>
  <li><strong>B.Cu</strong> (Back Copper) &mdash; Bottom signal layer</li>
  <li><strong>F.SilkS</strong> (Front Silkscreen) &mdash; Component labels</li>
  <li><strong>B.SilkS</strong> (Back Silkscreen) &mdash; Bottom labels</li>
  <li><strong>F.Mask</strong> (Front Solder Mask) &mdash; Mask openings for pads</li>
  <li><strong>B.Mask</strong> (Back Solder Mask) &mdash; Bottom mask openings</li>
  <li><strong>F.Paste</strong> (Front Paste) &mdash; Stencil for solder paste (needed for reflow assembly)</li>
  <li><strong>B.Paste</strong> (Back Paste) &mdash; Bottom stencil</li>
  <li><strong>Edge.Cuts</strong> &mdash; Board outline</li>
</ol>

<p><strong>Drill files:</strong> In addition to Gerbers, you must generate
drill files separately. In KiCad: <em>File &gt; Generate Drill Files</em>.
Select Excellon format, millimeters, and include both plated (PTH) and
non-plated (NPTH) holes. Most fabs expect two separate drill files.</p>

<p><strong>Pre-order checklist:</strong></p>
<ul>
  <li>Open each Gerber in a viewer (KiCad&rsquo;s built-in Gerber viewer, or
      the online viewers at JLCPCB/OSHPark) and visually inspect every layer.</li>
  <li>Verify the board outline (Edge.Cuts) is a closed shape with no gaps.</li>
  <li>Check that drill holes line up with pads on the copper layers.</li>
  <li>Confirm the layer count matches what you are ordering (4-layer).</li>
  <li>Verify the minimum trace width and clearance meet the fab&rsquo;s
      capabilities (JLCPCB: 0.09mm min for standard, 0.127mm recommended;
      OSHPark: 0.15mm min).</li>
  <li>Check that the smallest via drill size is within the fab&rsquo;s range
      (JLCPCB: 0.2mm min drill; OSHPark: 0.25mm min drill).</li>
  <li>If ordering assembly (PCBA), also export a BOM CSV and a
      pick-and-place / centroid file (component X,Y positions and rotations).</li>
</ul>

<p>Upload the Gerber ZIP to <strong>JLCPCB</strong> (cheapest, 4-layer from ~$7
for 5 boards, 5-7 day production) or <strong>OSHPark</strong> (US-based,
excellent quality, 4-layer at $10/sq-inch, shared panel). Both sites show a
rendered preview of your board before you order &mdash; inspect it
carefully.</p>
`,
        },
        {
          type: "info",
          variant: "tip",
          title: "Use a Reference Design",
          html: "Every FPGA vendor publishes reference designs and layout guidelines. Lattice provides the ECP5 Hardware Checklist (TN1263) and reference schematics. Xilinx has similar documents for Spartan-7. Start with these and modify -- do not design from scratch on your first board. Open-source FPGA boards like the ULX3S, OrangeCrab, and iCEBreaker publish their full KiCad source files on GitHub. Study them before starting your own design.",
        },
        {
          type: "code",
          label: "KiCad design rule constraints for FPGA board (board.kicad_dru excerpt)",
          code: `# KiCad Design Rules for 4-layer FPGA board
# These match typical low-cost PCB fab capabilities (JLCPCB, PCBWay)

(rule "Default Track Width"
  (condition "A.Type == 'track'")
  (constraint track_width (min 0.127mm) (opt 0.2mm))
)

(rule "Default Clearance"
  (condition "A.Type == 'track' && B.Type == 'track'")
  (constraint clearance (min 0.127mm))
)

(rule "Power Track Width"
  (condition "A.NetClass == 'Power'")
  (constraint track_width (min 0.3mm) (opt 0.5mm))
)

(rule "BGA Fanout"
  (condition "A.NetClass == 'BGA'")
  (constraint track_width (min 0.1mm) (opt 0.127mm))
)

(rule "Via Size"
  (condition "A.Type == 'via'")
  (constraint via_diameter (min 0.6mm))
  (constraint hole_size (min 0.3mm))
)

(rule "BGA Via"
  (condition "A.NetClass == 'BGA' && A.Type == 'via'")
  (constraint via_diameter (min 0.45mm))
  (constraint hole_size (min 0.2mm))
)

# Impedance targets (for controlled impedance order):
# 50-ohm single-ended microstrip:
#   Layer 1 over Layer 2 ground: 0.15mm trace, 0.2mm prepreg
# 100-ohm differential pair:
#   0.12mm trace, 0.15mm gap, 0.2mm prepreg
# Verify with your fab's impedance calculator`,
        },
        {
          type: "video",
          id: "aVUqaB0IMh4",
          title: "Phil's Lab -- How to Design a PCB from Start to Finish",
        },
        {
          type: "video",
          id: "35YuILUlfGs",
          title: "Digi-Key -- Getting Started with KiCad",
        },
        {
          type: "resources",
          links: [
            {
              type: "Tool",
              title: "KiCad EDA",
              url: "https://www.kicad.org/",
              desc: "Free, open-source electronics design suite. Industry-grade schematic and PCB editor.",
            },
            {
              type: "Reference",
              title: "Lattice ECP5 Hardware Checklist (TN1263)",
              url: "https://www.latticesemi.com/view_document?document_id=50464",
              desc: "Official hardware design guidelines for ECP5 FPGAs. Essential reading.",
            },
            {
              type: "Code",
              title: "ULX3S -- Open Source ECP5 FPGA Board",
              url: "https://github.com/emard/ulx3s",
              desc: "Complete KiCad source files for a well-designed ECP5 board. Study this.",
            },
            {
              type: "Code",
              title: "OrangeCrab -- ECP5 FPGA in Feather Form Factor",
              url: "https://github.com/orangecrab-fpga/orangecrab-hardware",
              desc: "Another excellent open-source ECP5 board design to reference.",
            },
            {
              type: "Tutorial",
              title: "PCB Design Tutorial (Altium Academy)",
              url: "https://www.altium.com/documentation/altium-designer/from-idea-to-manufacture",
              desc: "Comprehensive PCB design tutorial covering the full workflow.",
            },
            {
              type: "Service",
              title: "JLCPCB -- Low-cost PCB Fabrication",
              url: "https://jlcpcb.com/",
              desc: "Affordable 4-layer PCBs with assembly service. Popular for prototypes.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- FPGA Board Design",
          items: [
            "<strong>Study a reference design:</strong> Download the ULX3S or OrangeCrab KiCad files from GitHub. Open the schematic in Eeschema and identify: all power rails and their regulators, the JTAG connections, the clock source, and every decoupling capacitor. Count how many 100nF caps are used and verify each FPGA power pin has one.",
            "<strong>Draw the power tree:</strong> On paper or in a drawing tool, sketch the complete power distribution tree for your board: USB 5V input, each regulator with its input/output caps, the enable sequencing (which rails must come up first), and the estimated current draw on each rail.",
            "<strong>Schematic exercise:</strong> In KiCad, draw the schematic for the power supply section only. Include input protection (TVS diode, polyfuse), three regulators (3.3V, 2.5V, 1.1V), enable sequencing, power-good LED indicators, and all input/output capacitors. Run ERC (Electrical Rules Check) and fix any errors.",
            "<strong>Layout exercise:</strong> Using the KiCad PCB editor, place a BGA footprint (use any 256-ball, 0.8mm pitch BGA from the library) and practice BGA fanout. Route the outer two rows on the top layer, and fan out inner rows with dog-bone vias to the bottom layer. Check DRC.",
            "<strong>Full board design (capstone):</strong> Design the complete FPGA board from schematic through layout. Use the Lattice ECP5 in TQFP-144 if you want to hand-solder, or CABGA256 if you plan to use reflow. Generate Gerber files and get a quote from JLCPCB. Even if you do not order it, completing the design is the exercise.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 3: Board Bring-up and Testing
    // -------------------------------------------------------------------------
    {
      id: 3,
      title: "Board Bring-up and Testing",
      subtitle: "From bare PCB to running SoC",
      duration: "90 min",
      content: [
        {
          type: "text",
          html: `
<h2>Board Bring-up from First Principles</h2>

<p>You have designed a board, sent the Gerber files to a fab house, waited
two weeks, and a small purple or green PCB has arrived in the mail. It is
beautiful. It is also completely untested and possibly broken in subtle
ways. <strong>Board bring-up</strong> is the systematic process of turning
a bare PCB into a working system, one subsystem at a time.</p>

<p>The cardinal rule of bring-up: <strong>never power everything at once</strong>.
If something is wrong -- a short circuit, a backwards regulator, a missing
pull-up -- you want to discover it before it destroys other components.
Bring-up is done in stages, with verification at each stage before
proceeding to the next.</p>

<h3>Stage 0: Visual Inspection</h3>

<p>Before applying any power, inspect the board carefully:</p>

<ul>
  <li><strong>Solder bridges:</strong> Especially on fine-pitch components
      (QFP, BGA). Use a magnifying glass or USB microscope.</li>
  <li><strong>Missing components:</strong> Check the BOM against the board.
      Every pad should have its component.</li>
  <li><strong>Component orientation:</strong> Polarized capacitors, diode
      direction, IC pin 1 markers. A backwards voltage regulator will short
      the supply rail and possibly damage other parts.</li>
  <li><strong>Cold joints:</strong> Solder joints that look dull or grainy
      instead of shiny and smooth. These may have high resistance or
      intermittent contact.</li>
</ul>

<h3>Stage 1: Power-On (The Smoke Test)</h3>

<p>This is the most nerve-wracking moment. Before connecting USB or any
power source:</p>

<ol>
  <li><strong>Check for shorts:</strong> Use a multimeter in continuity mode
      to check between each power rail and ground. You should see
      <em>no continuity</em> (or a brief beep as capacitors charge, then
      silence). If you hear a steady beep, you have a short. Find it and
      fix it before applying power.</li>
  <li><strong>Current-limited supply:</strong> If possible, use a bench power
      supply with a current limit set to 100mA. Connect it to the 5V input.
      Watch the current draw. A bare board with just regulators and caps
      should draw 10-50mA. If it immediately hits the current limit,
      something is shorted.</li>
  <li><strong>Measure voltages:</strong> Check each power rail with a
      multimeter:
      <ul>
        <li>3.3V rail: should read 3.28-3.35V</li>
        <li>2.5V rail: should read 2.45-2.55V</li>
        <li>1.1V rail: should read 1.08-1.15V</li>
      </ul>
      If any rail is wrong, do not proceed. Debug the power supply first.</li>
  <li><strong>Check for heat:</strong> Touch each component (carefully).
      Nothing should be hot. A warm regulator is normal (it is dissipating
      power). A hot regulator or a hot FPGA means something is wrong.</li>
</ol>

<h3>Stage 2: JTAG Verification</h3>

<p>With power confirmed good, connect your JTAG adapter and try to
communicate with the FPGA:</p>

<ol>
  <li>Connect the JTAG adapter to the programming header.</li>
  <li>Run the IDCODE read (using OpenOCD, your bit-bang programmer, or
      the vendor's programming tool).</li>
  <li>If you get back the expected IDCODE (e.g., 0x41111043 for ECP5-25F),
      the FPGA is alive, the JTAG connections are good, and the power
      supply is working.</li>
  <li>If you get 0x00000000 or 0xFFFFFFFF, something is wrong: check JTAG
      wiring, power, pull-ups, and clock.</li>
</ol>

<h3>Stage 3: First Bitstream (Blink an LED)</h3>

<p>The simplest possible test: load a bitstream that does nothing but
blink an LED. This tests:</p>

<ul>
  <li>JTAG programming path (you can load a bitstream)</li>
  <li>FPGA configuration (the bitstream is valid)</li>
  <li>FPGA I/O (the pin drives the LED)</li>
  <li>Clock (the blink rate proves the oscillator is running at the
      expected frequency)</li>
</ul>

<p>If the LED blinks at the expected rate, you have a working FPGA board.
Everything from here is peripheral testing.</p>
`,
        },
        {
          type: "code",
          label: "Minimal LED blink design for ECP5 (blink.v)",
          code: `// blink.v -- Minimal LED blink for ECP5 board bring-up
// 10 lines of synthesizable Verilog

module blink (
    input  wire clk,    // 25 MHz oscillator input
    output wire led     // Active-low LED
);
    reg [23:0] counter = 0;

    always @(posedge clk)
        counter <= counter + 1;

    assign led = ~counter[23]; // Toggles at 25MHz / 2^24 ≈ 1.5 Hz
endmodule`,
        },
        {
          type: "code",
          label: "ECP5 pin constraint file (blink.lpf)",
          code: `# blink.lpf -- Pin constraints for ECP5 LFE5U-25F-6BG256
# Maps Verilog port names to physical ball positions
# Adjust ball locations to match YOUR board's schematic

# 25 MHz oscillator input -- must be on a global clock pin
LOCATE COMP "clk" SITE "P6";            # Ball P6 = GCL0 (bank 6 clock input)
IOBUF  PORT "clk" IO_TYPE=LVCMOS33;     # 3.3V CMOS logic level
FREQUENCY PORT "clk" 25.0 MHz;          # Inform tools of clock frequency

# LED output
LOCATE COMP "led" SITE "B2";            # Ball B2 = user I/O (bank 0)
IOBUF  PORT "led" IO_TYPE=LVCMOS33;     # 3.3V output

# Note: LOCATE assigns a Verilog port to a physical ball.
#       IOBUF sets the I/O standard (voltage level, drive strength).
#       FREQUENCY tells nextpnr the clock rate for timing analysis.
#       Ball positions come from YOUR schematic -- check which ball
#       your oscillator and LED are wired to.`,
        },
        {
          type: "code",
          label: "ECP5 open-source synthesis, place-and-route, and programming commands",
          code: `#!/bin/bash
# build_and_program.sh -- Complete ECP5 FPGA build flow
# Requires: yosys, nextpnr-ecp5, ecppack (from Project Trellis), ecpprog

# Step 1: SYNTHESIS (Yosys)
# Converts Verilog RTL into a gate-level netlist of ECP5 primitives.
# Input: Verilog source files
# Output: JSON netlist
yosys -p "read_verilog blink.v; synth_ecp5 -top blink -json blink.json"

# Step 2: PLACE AND ROUTE (nextpnr-ecp5)
# Takes the netlist and pin constraints, maps logic to physical LUTs
# and routes wires between them. Performs timing analysis.
# --25k        = target the LFE5U-25F (25K LUT) device
# --package    = BGA256 package
# --speed 6    = speed grade 6
# --lpf        = pin constraint file
# --textcfg    = output: text-format configuration for ecppack
nextpnr-ecp5 --25k --package CABGA256 --speed 6 \\
    --json blink.json \\
    --lpf blink.lpf \\
    --textcfg blink_out.config

# Step 3: BITSTREAM GENERATION (ecppack)
# Converts the text configuration into a binary bitstream file.
# --compress   = enable bitstream compression (smaller, faster load)
# --svf        = also generate SVF file (for OpenOCD programming)
ecppack --compress --svf blink.svf blink_out.config blink.bit

# Step 4: PROGRAM (ecpprog)
# Loads the bitstream into the FPGA via JTAG (volatile -- lost on power-off)
ecpprog blink.bit

# To program the SPI flash instead (persistent across power cycles):
# ecpprog -S blink.bit

echo "Done. LED should be blinking at ~1.5 Hz."`,
        },
        {
          type: "text",
          html: `
<h3>Stage 4: Peripheral Testing</h3>

<p>Test each peripheral subsystem independently:</p>
          `,
        },
        {
          type: "table",
          headers: ["Peripheral", "Test Method", "What It Proves", "Common Failures"],
          rows: [
            ["UART", "Load bitstream with UART TX. Send 'Hello World' at 115200 baud. Verify on PC terminal.", "UART TX pin, baud rate, level shifting", "Wrong pin assignment, baud rate mismatch, TX/RX swapped"],
            ["UART Loopback", "Connect FPGA UART TX to RX. Send data, verify it comes back.", "Both TX and RX paths, FPGA I/O bidirectional", "Soldering issue on RX pin, pin voltage mismatch"],
            ["SD Card (SPI)", "Load bitstream that sends CMD0 (GO_IDLE) and CMD8 (SEND_IF_COND). Read response.", "SPI clock, MOSI, MISO, CS signals, SD card power", "Missing pull-up on MISO, wrong SPI mode, card not seated"],
            ["SD Card (Read)", "Read block 0 (MBR). Verify 0x55AA signature at offset 510.", "Full SPI read path, SD card initialization sequence", "Clock too fast for card, initialization sequence wrong"],
            ["Ethernet (Link)", "Load bitstream with RMII interface. Check if link LED lights up when cable connected.", "PHY power, PHY-FPGA RMII connection, magnetics, RJ45", "Missing 50MHz RMII clock, PHY reset not released, bad magnetics"],
            ["Ethernet (Ping)", "Load bitstream with minimal MAC. Respond to ARP and ICMP. Ping from PC.", "Full Ethernet data path, MAC-PHY interface", "RMII timing, CRC errors, TX/RX swap"],
            ["Configuration Flash", "Program bitstream to SPI flash. Power cycle. FPGA should boot from flash.", "SPI flash connection, boot mode pins, bitstream integrity", "Wrong SPI mode, boot mode pins not set, flash too slow"],
          ],
        },
        {
          type: "code",
          label: "OpenOCD configuration for ECP5 FPGA with FTDI adapter",
          code: `# openocd_ecp5.cfg -- OpenOCD config for custom ECP5 board
# Use with: openocd -f openocd_ecp5.cfg

# JTAG adapter: FTDI FT232H or FT2232H
adapter driver ftdi
ftdi vid_pid 0x0403 0x6014     ;# FT232H VID/PID

# Pin mapping (depends on your adapter wiring)
# ADBUS0 = TCK, ADBUS1 = TDI, ADBUS2 = TDO, ADBUS3 = TMS
ftdi layout_init 0x0008 0x000b ;# Initial pin direction/value
ftdi layout_signal nTRST -data 0x0010   ;# Optional TRST on ADBUS4

# JTAG speed: start slow for debugging, increase once working
adapter speed 1000             ;# 1 MHz (conservative)
# adapter speed 10000          ;# 10 MHz (production)

# Target: Lattice ECP5
jtag newtap ecp5 tap -irlen 8 -expected-id 0x41111043
# IDCODE breakdown:
#   0x41111043 = LFE5U-25F
#   0x41112043 = LFE5U-45F
#   0x41113043 = LFE5U-85F

# Initialize
init

# Scan the JTAG chain and verify
scan_chain

# --- Useful commands to run interactively ---
# Read IDCODE:
#   > irscan ecp5.tap 0xE0
#   > drscan ecp5.tap 32 0x0
#
# Read USERCODE:
#   > irscan ecp5.tap 0xC0
#   > drscan ecp5.tap 32 0x0
#
# Program bitstream:
#   > svf path/to/bitstream.svf
#
# Or use ecpprog directly:
#   ecpprog -I "A" bitstream.bit`,
        },
        {
          type: "text",
          html: `
<h4>Decoding the OpenOCD Configuration Values</h4>

<p>The OpenOCD config above contains hex values that look opaque. Here is
what they actually mean:</p>

<p><code>ftdi layout_init 0x0008 0x000b</code></p>

<p>This command takes two arguments: <strong>initial pin values</strong> and
<strong>pin directions</strong>. Each bit corresponds to an ADBUS pin on
the FT232H:</p>

<ul>
  <li><strong>0x000b = 0b00001011</strong> (direction mask): Bit 0 (ADBUS0/TCK) =
      output, Bit 1 (ADBUS1/TDI) = output, Bit 2 (ADBUS2/TDO) = input
      (0 = input), Bit 3 (ADBUS3/TMS) = output. So TCK, TDI, TMS are
      driven by the adapter; TDO is read from the FPGA.</li>
  <li><strong>0x0008 = 0b00001000</strong> (initial value): TMS starts high
      (bit 3 = 1), TCK and TDI start low (bits 0,1 = 0). TMS high at
      startup is correct because it keeps the TAP controller in
      Test-Logic-Reset (the safe idle state).</li>
</ul>

<p><code>ftdi layout_signal nTRST -data 0x0010</code></p>

<p>This maps the TRST signal to ADBUS4 (bit 4 = 0x0010). The
<code>n</code> prefix means active-low: when OpenOCD asserts TRST, it
drives ADBUS4 low, which pulls the FPGA&rsquo;s PROGRAMN pin low and
forces reconfiguration.</p>

<p><code>adapter speed 1000</code></p>

<p>Sets the JTAG clock (TCK) frequency to 1 MHz. Start slow for
debugging; a working board can typically handle 10-25 MHz.</p>

<p><code>jtag newtap ecp5 tap -irlen 8 -expected-id 0x41111043</code></p>

<p>Declares a JTAG TAP named &ldquo;ecp5.tap&rdquo; with an 8-bit
instruction register. The <code>-expected-id</code> is the IDCODE that
OpenOCD will verify when it first connects. If the IDCODE read back does
not match, OpenOCD will report an error &mdash; this is your first
indication of a wiring or power problem.</p>
`,
        },
        {
          type: "code",
          label: "Bring-up test script (Bash) -- systematic verification",
          code: `#!/bin/bash
# bringup_test.sh -- Systematic board bring-up verification script
# Run after assembling a new FPGA board

set -e

RED="\\033[0;31m"
GREEN="\\033[0;32m"
YELLOW="\\033[1;33m"
NC="\\033[0m"

pass() { echo -e "$GREEN[PASS]$NC $1"; }
fail() { echo -e "$RED[FAIL]$NC $1"; exit 1; }
info() { echo -e "$YELLOW[INFO]$NC $1"; }

echo "============================================"
echo "  FPGA Board Bring-up Test Suite"
echo "============================================"
echo ""

# Stage 1: JTAG Communication
info "Stage 1: Testing JTAG communication..."

# Try to read IDCODE using ecpprog (for ECP5)
IDCODE=$(ecpprog -t 2>/dev/null | grep -oP "0x[0-9a-fA-F]+" | head -1)

if [ -z "$IDCODE" ]; then
    fail "No JTAG response. Check: power, JTAG wiring, adapter."
fi

EXPECTED_ID="0x41111043"  # LFE5U-25F
if [ "$IDCODE" = "$EXPECTED_ID" ]; then
    pass "IDCODE matches: $IDCODE (LFE5U-25F)"
else
    info "IDCODE: $IDCODE (expected $EXPECTED_ID)"
    fail "Unexpected IDCODE. Wrong FPGA or wiring issue."
fi

# Stage 2: LED Blink Test
info "Stage 2: Programming LED blink test..."
ecpprog blink_test.bit
if [ $? -eq 0 ]; then
    pass "Bitstream programmed successfully"
    echo "  -> Verify: LED should blink at ~1Hz"
    read -p "  -> Does the LED blink? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pass "LED blink confirmed -- clock and I/O working"
    else
        fail "LED not blinking. Check: oscillator, LED wiring, pin assignment."
    fi
else
    fail "Bitstream programming failed"
fi

# Stage 3: UART Test
info "Stage 3: Testing UART..."
ecpprog uart_test.bit

# Send test string and check for echo
UART_DEV="/dev/ttyUSB0"
stty -F $UART_DEV 115200 cs8 -cstopb -parenb raw
echo "HELLO" > $UART_DEV
sleep 0.5
RESPONSE=$(timeout 2 cat $UART_DEV 2>/dev/null || true)

if echo "$RESPONSE" | grep -q "HELLO"; then
    pass "UART loopback working at 115200 baud"
else
    info "No UART response. Check: USB-serial chip, TX/RX wiring, baud rate."
    fail "UART test failed"
fi

# Stage 4: SD Card Test
info "Stage 4: Testing SD card (SPI mode)..."
ecpprog sd_test.bit
sleep 1

# The SD test bitstream should output results over UART
SD_RESULT=$(timeout 5 cat $UART_DEV 2>/dev/null || true)

if echo "$SD_RESULT" | grep -q "SD_OK"; then
    pass "SD card detected and responding"
    if echo "$SD_RESULT" | grep -q "MBR_OK"; then
        pass "SD card MBR read successfully (0x55AA signature found)"
    fi
else
    info "SD card not responding. Check: card inserted, SPI wiring, pull-ups."
    fail "SD card test failed"
fi

# Stage 5: Ethernet Link Test
info "Stage 5: Testing Ethernet link..."
ecpprog eth_test.bit
sleep 2

if echo "$SD_RESULT" | grep -q "LINK_UP"; then
    pass "Ethernet link established"
else
    info "No Ethernet link. Check: PHY power, RMII clock, RJ45, cable."
    fail "Ethernet link test failed"
fi

echo ""
echo "============================================"
echo -e "  $GREEN ALL TESTS PASSED $NC"
echo "============================================"
echo ""
echo "Board is ready for full SoC deployment!"`,
        },
        {
          type: "text",
          html: `
<h3>Stage 5: The Full SoC -- The Grand Finale</h3>

<p>This is it. The moment the entire course has been building toward. You
are about to load the complete system-on-chip -- the CPU you designed from
NAND gates, the compiler that targets it, the operating system that runs
on it, the networking stack that connects it -- onto real silicon that you
designed the board for.</p>

<ol>
  <li>Synthesize the full SoC design with Yosys (or Vivado for Xilinx).</li>
  <li>Place and route with nextpnr (or Vivado).</li>
  <li>Generate the bitstream.</li>
  <li>Load it via JTAG.</li>
  <li>Connect the serial console.</li>
  <li>Insert the SD card with your filesystem.</li>
  <li>Plug in the Ethernet cable.</li>
  <li>Watch it boot.</li>
</ol>

<p>If you see your shell prompt appear on the serial console, you have
done it. You have gone from a transistor -- a switch made of doped
silicon -- all the way up to a working computer. You understand every
single layer because you built every single layer.</p>

<h3>Timing Closure and Reading nextpnr Reports</h3>

<p>When nextpnr finishes place-and-route, it performs <strong>static timing
analysis</strong> and reports whether your design meets timing. The key
output to look for:</p>

<pre>Info: Max frequency for clock 'clk': 62.35 MHz (PASS at 25.00 MHz)</pre>

<p>This means the longest combinational path in your design can run at
62.35 MHz, and since you requested 25 MHz (via the <code>.lpf</code> file),
timing is met with comfortable margin. If you see <strong>FAIL</strong>,
the design has paths that are too slow for the requested clock frequency.
The report will list the <strong>critical path</strong> &mdash; the
longest chain of logic and routing between two flip-flops. It typically
looks like:</p>

<pre>Info: Critical path: net &ldquo;cpu/alu_result_15&rdquo; from cell &ldquo;cpu/alu_reg[15]&rdquo;
      to cell &ldquo;cpu/writeback_reg[15]&rdquo; delay 18.3ns (logic 6.2ns, routing 12.1ns)</pre>

<p><strong>How to fix timing failures:</strong></p>
<ul>
  <li><strong>If routing delay dominates:</strong> The placer put the cells
      too far apart. Try running nextpnr with <code>--seed N</code> (different
      random seeds give different placements) or <code>--timing-allow-fail</code>
      to see if a different seed succeeds.</li>
  <li><strong>If logic delay dominates:</strong> Your combinational path has
      too many levels of logic. Add a pipeline register to break the path
      into two clock cycles. This is the most common fix in FPGA design.</li>
  <li><strong>Lower the clock frequency:</strong> If your design does not
      need 50 MHz, targeting 25 MHz gives the tools much more slack.</li>
</ul>

<p>Always check that timing passes before programming the FPGA. A design
that fails timing may appear to work sometimes but exhibit random,
difficult-to-debug glitches.</p>

<h3>Debugging Hardware with Instruments</h3>

<h4>The Oscilloscope</h4>

<p>An oscilloscope shows voltage versus time. For board bring-up, you
use it to:</p>

<ul>
  <li><strong>Verify clock signals:</strong> Is the oscillator running?
      What frequency? Is the waveform clean (not rounded or ringing)?</li>
  <li><strong>Check power rails:</strong> Is there excessive ripple or
      noise on the supply? (Use AC coupling to zoom in on the noise.)</li>
  <li><strong>Debug signal integrity:</strong> Do high-speed signals have
      clean edges? Is there ringing or overshoot?</li>
  <li><strong>Measure timing:</strong> Is the setup/hold time adequate on
      the RMII interface? Use cursors to measure.</li>
</ul>

<h4>The Logic Analyzer</h4>

<p>A logic analyzer captures digital waveforms on many channels
simultaneously and can decode protocols. For FPGA bring-up:</p>

<ul>
  <li><strong>JTAG decoding:</strong> Verify the TAP state transitions and
      data being shifted in/out.</li>
  <li><strong>SPI decoding:</strong> See the exact bytes exchanged with the
      SD card. Verify command/response sequences.</li>
  <li><strong>UART decoding:</strong> Verify baud rate and data content.</li>
  <li><strong>RMII decoding:</strong> Inspect Ethernet frames at the
      PHY-FPGA interface.</li>
</ul>

<p>An inexpensive USB logic analyzer (like the Saleae Logic clone or
Sigrok-compatible devices) costs $10-50 and is an invaluable tool. The
open-source PulseView/Sigrok software can decode dozens of protocols.</p>

<h4>Common Hardware Debugging Techniques</h4>

<ul>
  <li><strong>Divide and conquer:</strong> If something does not work,
      isolate the subsystem. Load a bitstream that only tests that one
      peripheral.</li>
  <li><strong>Loopback tests:</strong> Connect output to input and verify
      data integrity. Works for UART, SPI, and even Ethernet (with a
      loopback cable).</li>
  <li><strong>Known-good comparison:</strong> If you have a working
      development board, compare signals with an oscilloscope. Your board's
      signals should look the same.</li>
  <li><strong>Voltage probing:</strong> If a peripheral does not respond,
      check that its power pin actually has the correct voltage. A bad
      solder joint can look fine visually but have no electrical connection.</li>
  <li><strong>Freeze spray:</strong> If a board works intermittently,
      cooling specific components with freeze spray can help identify
      thermal issues.</li>
</ul>
          `,
        },
        {
          type: "diagram",
          content: `Board Bring-up Verification Flow
══════════════════════════════════

  ┌───────────────────┐
  │  Visual Inspection │
  │  (no power)       │
  └────────┬──────────┘
           │ OK
  ┌────────▼──────────┐
  │  Continuity Check  │──── Short found ──> Debug & rework
  │  (multimeter)      │
  └────────┬──────────┘
           │ No shorts
  ┌────────▼──────────┐
  │  Apply Power       │──── Overcurrent ──> Remove power,
  │  (current limited) │                     find short
  └────────┬──────────┘
           │ Current OK
  ┌────────▼──────────┐
  │  Measure Rails     │──── Wrong voltage -> Debug regulator
  │  3.3V, 2.5V, 1.1V │                      circuit
  └────────┬──────────┘
           │ All rails OK
  ┌────────▼──────────┐
  │  JTAG IDCODE Read  │──── No response ──> Check JTAG wiring,
  │                    │                     power, pull-ups
  └────────┬──────────┘
           │ IDCODE OK
  ┌────────▼──────────┐
  │  LED Blink Test    │──── No blink ─────> Check oscillator,
  │  (simplest design) │                     pin assignment
  └────────┬──────────┘
           │ Blinks correctly
  ┌────────▼──────────┐
  │  UART Test         │──── No output ────> Check USB-serial,
  │  (hello world)     │                     TX/RX, baud rate
  └────────┬──────────┘
           │ UART working
  ┌────────▼──────────┐
  │  SD Card Test      │──── No response ──> Check SPI wiring,
  │  (SPI mode init)   │                     pull-ups, card
  └────────┬──────────┘
           │ SD card working
  ┌────────▼──────────┐
  │  Ethernet Test     │──── No link ──────> Check PHY, RMII
  │  (link + ping)     │                     clock, magnetics
  └────────┬──────────┘
           │ All peripherals working
  ┌────────▼──────────┐
  │  ╔═══════════════╗ │
  │  ║  LOAD FULL    ║ │
  │  ║  SoC DESIGN   ║ │
  │  ║               ║ │
  │  ║  Boot your OS ║ │
  │  ║  from SD card ║ │
  │  ║               ║ │
  │  ║  It works!    ║ │
  │  ╚═══════════════╝ │
  └────────────────────┘
`,
        },
        {
          type: "info",
          variant: "success",
          title: "The Celebratory Moment",
          html: "When your shell prompt appears on the serial console, running on a CPU you designed, executing instructions you defined, on an operating system you wrote, on a board you designed -- take a moment to appreciate what you have accomplished. You have gone from a single transistor to a complete working computer. You understand every layer of the stack, from the physics of semiconductors through digital logic, processor architecture, compilers, operating systems, and networking. Very few people in the world can say that. This is not just an exercise -- it is a deep understanding of how computing actually works, from the bottom up.",
        },
        {
          type: "info",
          variant: "warning",
          title: "Safety During Bring-up",
          html: "Always use a current-limited power supply for first power-on. Keep a fire extinguisher nearby when testing new boards (only half joking). Never probe a board with wet hands. Be careful with charged capacitors -- large bulk caps can hold enough energy to damage components if shorted. If a component starts smoking, disconnect power immediately. A smoking component is destroyed, but the rest of the board may be salvageable if you act fast.",
        },
        {
          type: "info",
          variant: "warning",
          title: "ESD Protection: Static Electricity Destroys FPGAs",
          html: "FPGA gate oxide layers are only a few nanometers thick. A static discharge from your body (which you may not even feel below ~3,000V) can punch through this oxide and permanently damage the chip. <strong>Always wear a grounded ESD wrist strap</strong> when handling bare PCBs with ICs. Work on a <strong>grounded ESD mat</strong> (conductive foam or a commercial anti-static mat connected to earth ground through a 1M-ohm resistor). Store boards in <strong>anti-static bags</strong> (the pink or silver-shielded kind, not regular plastic bags). Never touch the FPGA or PHY chip pins directly. Avoid synthetic clothing and carpeted floors in your workspace -- both generate static. These precautions are not optional: ESD damage is cumulative and often causes subtle, intermittent failures that are nearly impossible to debug.",
        },
        {
          type: "video",
          id: "QqxRel8N-gY",
          title: "Applied Science -- PCB Board Bring-up and Debugging",
        },
        {
          type: "resources",
          links: [
            {
              type: "Tool",
              title: "ecpprog -- Open Source ECP5 Programmer",
              url: "https://github.com/gregdavill/ecpprog",
              desc: "Command-line tool for programming Lattice ECP5 FPGAs via JTAG or SPI.",
            },
            {
              type: "Tool",
              title: "OpenOCD -- Open On-Chip Debugger",
              url: "https://openocd.org/",
              desc: "Versatile JTAG/SWD debugger supporting many targets including ECP5 and Xilinx FPGAs.",
            },
            {
              type: "Tool",
              title: "Sigrok / PulseView -- Logic Analyzer Software",
              url: "https://sigrok.org/wiki/PulseView",
              desc: "Open-source signal analysis software supporting protocol decoding.",
            },
            {
              type: "Tutorial",
              title: "EEVblog -- PCB Debugging Techniques",
              url: "https://www.youtube.com/watch?v=GILjgaexp6s",
              desc: "Dave Jones demonstrates practical PCB debugging with real equipment.",
            },
            {
              type: "Reference",
              title: "Lattice ECP5 sysCONFIG Usage Guide (TN1260)",
              url: "https://www.latticesemi.com/view_document?document_id=50462",
              desc: "Official guide for FPGA configuration modes: JTAG, SPI flash, and more.",
            },
            {
              type: "Tutorial",
              title: "Project Trellis -- ECP5 Bitstream Documentation",
              url: "https://prjtrellis.readthedocs.io/",
              desc: "Open-source documentation of the ECP5 bitstream format.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Board Bring-up",
          items: [
            "<strong>Simulated bring-up checklist:</strong> Even without a physical board, write a complete bring-up checklist document for your FPGA board design. For each stage, list: what to test, what tools to use, what the expected result is, and what to do if the test fails. This document is what professional hardware engineers write before they power on a new design.",
            "<strong>JTAG verification:</strong> If you have any FPGA development board (iCEBreaker, ULX3S, Arty, etc.), use OpenOCD to read the IDCODE and experiment with JTAG commands. Try reading the USERCODE register. Try programming a bitstream via SVF file.",
            "<strong>Oscilloscope exercise:</strong> Using any development board, probe the crystal oscillator output with an oscilloscope. Measure the frequency, amplitude, rise/fall time, and duty cycle. Then probe a power rail with AC coupling and measure the peak-to-peak ripple noise.",
            "<strong>Logic analyzer exercise:</strong> Connect a logic analyzer to the SPI pins of an SD card slot on any FPGA board. Load a design that initializes the SD card. Capture and decode the SPI traffic. Identify CMD0, CMD8, ACMD41, and CMD58 in the captured data.",
            "<strong>Full integration test:</strong> On your development board, load the complete SoC design (CPU, memory, UART, SD controller). Boot the operating system from SD card. Ping the board over Ethernet (if available). Run a program from the shell. This is the final test -- if it all works, you have completed the journey from transistor to computer.",
          ],
        },
      ],
    },
  ],
}

// Named export used by courseData.js
