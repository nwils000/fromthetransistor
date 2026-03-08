// =============================================================================
// SECTION 5: OPERATING SYSTEM
// =============================================================================
// Covers virtual memory, paging, MMU, TLB, process management, context
// switching, scheduling, system calls, the Unix process model, interrupts,
// device drivers, SD card protocol, FAT filesystem, shell, and Unix utilities.
// =============================================================================

export const section5 = {
  id: 5,
  title: "Operating System",
  subtitle: "Build a Unix-like kernel from scratch",
  duration: "10-14 weeks",
  description:
    "Implement virtual memory with paging, process management with preemptive multitasking, system calls, interrupt handling, device drivers, a FAT filesystem, a shell, and core Unix utilities.",
  longDescription:
    "This section takes you from bare metal to a functioning Unix-like operating system. You will learn how the MMU translates virtual addresses to physical ones through page tables, how the TLB accelerates that translation, how page faults let the OS implement demand paging, and how context switching gives each process the illusion of owning the entire CPU. You will implement preemptive round-robin scheduling driven by a timer interrupt, build the classic Unix system calls (fork, exec, open, read, write, close, exit, wait), write an interrupt-driven SD card driver using SPI mode, mount a FAT16/FAT32 filesystem, and cap it all off with a working shell and basic Unix utilities (cat, ls, rm, echo).",
  topics: [
    "Virtual Memory",
    "Paging & Page Tables",
    "MMU & TLB",
    "Context Switching",
    "Round-Robin Scheduling",
    "System Calls",
    "Unix Process Model",
    "Interrupts",
    "Device Drivers",
    "SD Card / SPI",
    "FAT Filesystem",
    "Shell",
    "Unix Utilities",
  ],
  learningGoals: [
    "Understand how virtual memory maps virtual addresses to physical frames through page tables",
    "Explain the role of the MMU and TLB in hardware-accelerated address translation",
    "Handle page faults and implement demand paging",
    "Implement context switching to save/restore process state",
    "Build a preemptive round-robin scheduler driven by a timer interrupt",
    "Implement core Unix system calls: fork, exec, open, read, write, close, exit, wait",
    "Explain the Unix process model (fork-exec, zombie, orphan, init)",
    "Write interrupt service routines and manage an interrupt vector table",
    "Build an SD card driver using SPI mode",
    "Read and write a FAT16/FAT32 filesystem (BPB, cluster chains, directory entries)",
    "Write a simple shell that parses commands and manages foreground/background processes",
    "Implement cat, ls, rm, and echo from scratch in C",
  ],

  // ===========================================================================
  // LESSONS
  // ===========================================================================
  lessons: [
    // -------------------------------------------------------------------------
    // LESSON 1: Virtual Memory and Paging
    // -------------------------------------------------------------------------
    {
      id: 1,
      title: "Virtual Memory and Paging",
      subtitle: "Why every process thinks it owns all of memory",
      duration: "90 min",
      content: [
        {
          type: "text",
          html: `
<h2>Virtual Memory from First Principles</h2>

<p>Imagine you have four programs running at once. Each one was compiled to use
addresses starting at 0x00000000. If they all ran directly on physical RAM they
would overwrite each other immediately. <strong>Virtual memory</strong> solves
this by giving every process its own private address space that is
<em>mapped</em> onto physical RAM by the hardware.</p>

<h3>The Core Idea</h3>

<p>Virtual memory splits both virtual and physical address spaces into
fixed-size chunks:</p>

<ul>
  <li><strong>Page</strong> &mdash; a fixed-size block of virtual memory (typically 4 KB).</li>
  <li><strong>Frame</strong> &mdash; a fixed-size block of physical memory (same size as a page).</li>
</ul>

<p>A data structure called the <strong>page table</strong> maps every virtual
page to a physical frame. The CPU's <strong>Memory Management Unit (MMU)</strong>
consults this table on every memory access &mdash; transparently, at hardware
speed.</p>

<h3>Address Translation Step by Step</h3>

<p>Suppose pages are 4 KB (2<sup>12</sup> bytes). A 32-bit virtual address is
split into two parts:</p>

<table>
  <tr><th>Bits 31&ndash;12 (20 bits)</th><th>Bits 11&ndash;0 (12 bits)</th></tr>
  <tr><td>Virtual Page Number (VPN)</td><td>Offset within the page</td></tr>
</table>

<ol>
  <li>The MMU extracts the VPN from the virtual address.</li>
  <li>It indexes into the current process's page table using the VPN.</li>
  <li>The page table entry (PTE) contains the <strong>Physical Frame Number
      (PFN)</strong> plus permission bits (read, write, execute, valid).</li>
  <li>The MMU concatenates PFN + Offset to form the physical address.</li>
  <li>If the PTE's valid bit is 0, the MMU raises a <strong>page fault</strong>
      exception and the OS kernel takes over.</li>
</ol>

<h3>Why It Works: Locality</h3>

<p>Programs do not touch all of their memory all the time. They exhibit
<strong>temporal locality</strong> (recently accessed data is likely to be
accessed again) and <strong>spatial locality</strong> (nearby addresses are
likely to be accessed together). This means only a small <em>working set</em>
of pages needs to be in physical RAM at any moment. Pages that have not been
touched recently can be evicted to disk (<em>swapped out</em>) and brought
back on demand when a page fault occurs.</p>

<h3>Multi-Level Page Tables</h3>

<p>A single flat page table for a 32-bit address space with 4 KB pages would
need 2<sup>20</sup> = 1,048,576 entries. At 4 bytes each that is 4 MB per
process &mdash; wasteful when most entries are invalid. The solution is a
<strong>multi-level page table</strong>:</p>

<ul>
  <li>The VPN is split into two (or more) parts.</li>
  <li>The first part indexes a <strong>page directory</strong> that points to
      second-level page tables.</li>
  <li>Second-level tables are allocated only when needed.</li>
  <li>On x86, the register <code>CR3</code> holds the physical address of
      the top-level page directory.</li>
</ul>

<p>This is exactly how x86 two-level paging works, and ARM uses a similar
scheme (TTBR0/TTBR1 registers).</p>

<h3>Concrete Walkthrough: Translating 0x00002ABC</h3>

<p>Assume 4 KB pages (2<sup>12</sup> = 4096 bytes), so the offset is 12 bits
and the VPN is the upper 20 bits.</p>

<pre><code>
Virtual address: 0x00002ABC

Step 1 -- Split the address:
  Binary: 0000 0000 0000 0000 0010 1010 1011 1100
  VPN    = upper 20 bits = 0x00002  (page 2)
  Offset = lower 12 bits = 0xABC   (byte 2748 within the page)

Step 2 -- Page table lookup:
  page_table[2] = { frame = 8, valid = 1, rw = 1 }
  PFN = 8

Step 3 -- Form physical address:
  Physical address = (PFN &lt;&lt; 12) | Offset
                   = (0x8 &lt;&lt; 12) | 0xABC
                   = 0x00008000  | 0x00000ABC
                   = 0x00008ABC
</code></pre>

<p>So virtual <code>0x00002ABC</code> maps to physical <code>0x00008ABC</code>.
The VPN (2) selects the page table entry, and the offset (0xABC) passes
through unchanged.</p>
          `,
        },
        {
          type: "code",
          label: "Simulated page table lookup in C",
          code: `#include <stdio.h>
#include <stdint.h>

#define PAGE_SIZE   4096    /* 4 KB = 2^12 */
#define PAGE_SHIFT  12
#define NUM_PAGES   4

/* Each page table entry stores a frame number and a valid bit. */
typedef struct {
    uint32_t frame;   /* physical frame number */
    int      valid;   /* 1 = mapped, 0 = not present */
} pte_t;

/* A tiny page table: VPN 0-3 */
pte_t page_table[NUM_PAGES] = {
    { .frame = 5, .valid = 1 },   /* VPN 0 -> frame 5 */
    { .frame = 3, .valid = 1 },   /* VPN 1 -> frame 3 */
    { .frame = 8, .valid = 1 },   /* VPN 2 -> frame 8 */
    { .frame = 0, .valid = 0 },   /* VPN 3 -> not mapped */
};

int translate(uint32_t virtual_addr, uint32_t *physical_addr) {
    uint32_t vpn    = virtual_addr >> PAGE_SHIFT;
    uint32_t offset = virtual_addr & (PAGE_SIZE - 1);

    if (vpn >= NUM_PAGES || !page_table[vpn].valid) {
        return -1;  /* PAGE FAULT */
    }
    *physical_addr = (page_table[vpn].frame << PAGE_SHIFT) | offset;
    return 0;
}

int main(void) {
    uint32_t tests[] = { 0x00000ABC, 0x00001234, 0x00002ABC, 0x00003010 };
    for (int i = 0; i < 4; i++) {
        uint32_t pa;
        if (translate(tests[i], &pa) == 0)
            printf("0x%08X -> 0x%08X\\n", tests[i], pa);
        else
            printf("0x%08X -> PAGE FAULT\\n", tests[i]);
    }
    return 0;
}
/* Output:
 * 0x00000ABC -> 0x00005ABC
 * 0x00001234 -> 0x00003234
 * 0x00002ABC -> 0x00008ABC
 * 0x00003010 -> PAGE FAULT
 */`,
        },
        {
          type: "video",
          id: "2quKyPnUShQ",
          title: "David Black-Schaffer -- Virtual Memory (Full Lecture Series)",
        },
        {
          type: "video",
          id: "A9WLYbE0p-I",
          title: "CS 162 (UC Berkeley) -- Virtual Memory Concepts",
        },
        {
          type: "resources",
          links: [
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 18 -- Paging: Introduction",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf",
              desc: "The definitive free chapter on paging from Operating Systems: Three Easy Pieces.",
            },
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 20 -- Paging: Smaller Tables",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-smalltables.pdf",
              desc: "Multi-level and inverted page tables.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- Paging",
              url: "https://wiki.osdev.org/Paging",
              desc: "Practical x86 paging setup guide for OS developers.",
            },
            {
              type: "Article",
              title: "Virtual Memory Explained (TutorialsPoint)",
              url: "https://www.tutorialspoint.com/operating_system/os_virtual_memory.htm",
              desc: "Clear introduction with diagrams.",
            },
            {
              type: "Course",
              title: "UIC CS -- Virtual Memory Notes",
              url: "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/9_VirtualMemory.html",
              desc: "Comprehensive university-level notes with worked examples.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Virtual Memory",
          items: [
            "<strong>Paper exercise:</strong> Given a 32-bit virtual address space with 4 KB pages, calculate: (a) how many bits for VPN, (b) how many bits for offset, (c) total page table entries, (d) page table size if each PTE is 4 bytes.",
            "<strong>Two-level page table:</strong> Repeat the above for a two-level scheme where the VPN is split into a 10-bit directory index and a 10-bit table index. How much memory is saved when only 3 second-level tables are allocated?",
            "<strong>Address translation:</strong> Given a page table {VPN 0 -> Frame 5, VPN 1 -> Frame 3, VPN 2 -> Frame 8}, translate virtual addresses 0x00000ABC, 0x00001234, and 0x00002FFF to physical addresses (4 KB pages).",
            "<strong>Code:</strong> Write a C program that simulates single-level address translation. It should take a virtual address and a page table (array) and output the physical address or 'PAGE FAULT'.",
            "<strong>Exploration:</strong> On Linux, read <code>/proc/self/maps</code> from a C program and print the mapped virtual address ranges. Discuss what each region is (code, heap, stack, shared libs).",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 2: MMU and TLB
    // -------------------------------------------------------------------------
    {
      id: 2,
      title: "The MMU and TLB",
      subtitle: "Hardware-accelerated address translation",
      duration: "75 min",
      content: [
        {
          type: "text",
          html: `
<h2>Memory Management Unit (MMU)</h2>

<p>The <strong>MMU</strong> is a hardware component &mdash; typically integrated
directly into the CPU &mdash; that sits between the processor core and the
memory bus. Every load and store instruction passes through the MMU, which
translates the virtual address to a physical address before the memory access
reaches RAM.</p>

<h3>What the MMU Does</h3>

<ol>
  <li><strong>Address translation:</strong> Converts virtual addresses to
      physical addresses using the current page table.</li>
  <li><strong>Permission checking:</strong> Enforces read/write/execute
      permissions on each page. If a process tries to write to a read-only
      page, the MMU raises a fault.</li>
  <li><strong>Process isolation:</strong> Each process has its own page table.
      When the OS context-switches to a different process, it loads a new page
      table base address (e.g., CR3 on x86, TTBR on ARM). The new process
      cannot see the old process's physical frames.</li>
</ol>

<h3>Without an MMU</h3>

<p>Some microcontrollers (like the ARM Cortex-M0) have no MMU. On these
systems every address is a physical address, there is no memory protection
between tasks, and a bug in one task can corrupt another. Real-time operating
systems on such chips use software discipline instead of hardware enforcement.</p>

<h2>Translation Lookaside Buffer (TLB)</h2>

<p>Walking the page table on every memory access is expensive &mdash; it
requires at least one extra memory read per level. A two-level page table
means two extra memory reads before you can do the one you actually wanted.
The <strong>TLB</strong> solves this.</p>

<h3>What the TLB Is</h3>

<p>The TLB is a small, extremely fast <strong>hardware cache</strong> inside the
MMU that stores recent virtual-to-physical translations. Think of it as a hash
table with typically 32&ndash;1024 entries.</p>

<h3>TLB Lookup Flow</h3>

<ol>
  <li>CPU issues a virtual address.</li>
  <li>MMU checks the TLB <strong>in parallel</strong> (fully-associative
      lookup). All entries are compared simultaneously in hardware.</li>
  <li><strong>TLB Hit:</strong> The physical frame number is returned
      immediately (often in a single cycle). No page table walk needed.</li>
  <li><strong>TLB Miss:</strong> The MMU walks the page table in memory,
      finds the PTE, loads the translation into the TLB (possibly evicting
      an old entry using LRU), and retries.</li>
  <li>If the page table walk finds an invalid PTE, a page fault is raised.</li>
</ol>

<h3>TLB Flushing</h3>

<p>When the OS switches to a new process, the TLB contains stale translations
from the old process. The simplest approach is to <strong>flush the entire
TLB</strong> on every context switch. This is simple but expensive &mdash;
the new process starts with an empty TLB and suffers many misses.</p>

<p>Modern CPUs support <strong>Address Space Identifiers (ASIDs)</strong>.
Each TLB entry is tagged with the ASID of the process that created it. On a
context switch the OS just changes the current ASID &mdash; no flush needed.
Entries from the old process remain in the TLB and will simply not match
because the ASID differs.</p>

<h3>TLB Performance Impact</h3>

<p>A typical TLB hit rate is 99%+. Because the TLB is checked on every
single memory access (including instruction fetches), even a 1% miss rate
translates to a significant performance penalty. This is why huge pages
(2 MB or 1 GB) exist &mdash; they cover more virtual address space with
fewer TLB entries.</p>
          `,
        },
        {
          type: "video",
          id: "95QpHJX55RE",
          title: "Neso Academy -- Translation Lookaside Buffer (TLB)",
        },
        {
          type: "video",
          id: "ZjKS1IbiGDA",
          title: "David Black-Schaffer -- Page Tables and TLB",
        },
        {
          type: "resources",
          links: [
            {
              type: "Article",
              title: "GeeksforGeeks -- TLB in Paging",
              url: "https://www.geeksforgeeks.org/translation-lookaside-buffer-tlb-in-paging/",
              desc: "Step-by-step walkthrough of TLB hit and miss behavior.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- TLB",
              url: "https://wiki.osdev.org/TLB",
              desc: "Practical TLB management for OS developers.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- MMU",
              url: "https://wiki.osdev.org/Memory_Management_Unit",
              desc: "MMU setup and page table configuration.",
            },
            {
              type: "Article",
              title: "Cornell CS4410 -- Hardware Support for Memory Management",
              url: "https://www.cs.cornell.edu/courses/cs4410/2018su/lectures/lec11-mmu.html",
              desc: "University lecture notes covering MMU internals.",
            },
            {
              type: "Article",
              title: "ARM Developer -- The Memory Management Unit",
              url: "https://developer.arm.com/documentation/101811/latest/The-Memory-Management-Unit--MMU-",
              desc: "Official ARM documentation on MMU configuration.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- MMU and TLB",
          items: [
            "<strong>TLB simulation:</strong> Write a program that simulates a TLB with 4 entries using LRU replacement. Feed it a sequence of virtual page numbers and print HIT/MISS for each access. Track the hit rate.",
            "<strong>Effective access time:</strong> If a TLB hit takes 10 ns, a TLB miss adds 100 ns (for the page table walk), and the TLB hit rate is 98%, calculate the effective memory access time. Repeat for hit rates of 90% and 99.5%.",
            "<strong>ASID exercise:</strong> Extend your TLB simulator to include an ASID field. Show that context switches without flushing still produce correct translations when ASIDs differ.",
            "<strong>ARM exploration:</strong> Read the ARM Architecture Reference Manual section on TTBR0/TTBR1 and explain how ARM splits the address space between user and kernel using two page table base registers.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 3: Page Tables and Page Faults
    // -------------------------------------------------------------------------
    {
      id: 3,
      title: "Page Tables and Page Faults",
      subtitle: "The data structures behind virtual memory and what happens on a miss",
      duration: "80 min",
      content: [
        {
          type: "text",
          html: `
<h2>Page Table Entries in Detail</h2>

<p>Each entry in the page table (PTE) is not just a frame number. It contains
several important bit fields:</p>

<table>
  <tr><th>Bit(s)</th><th>Name</th><th>Purpose</th></tr>
  <tr><td>0</td><td>Present / Valid</td><td>Is this page currently in physical memory?</td></tr>
  <tr><td>1</td><td>Read/Write</td><td>0 = read-only, 1 = read+write</td></tr>
  <tr><td>2</td><td>User/Supervisor</td><td>Can user-mode code access this page?</td></tr>
  <tr><td>3</td><td>Write-Through</td><td>Cache write policy</td></tr>
  <tr><td>4</td><td>Cache Disable</td><td>Disable caching for MMIO pages</td></tr>
  <tr><td>5</td><td>Accessed</td><td>Set by MMU when page is read</td></tr>
  <tr><td>6</td><td>Dirty</td><td>Set by MMU when page is written</td></tr>
  <tr><td>12&ndash;31</td><td>Frame Number</td><td>Physical frame this virtual page maps to</td></tr>
</table>

<h3>Page Faults</h3>

<p>A <strong>page fault</strong> occurs when the MMU cannot complete an address
translation. There are three main reasons:</p>

<ol>
  <li><strong>The page is not present</strong> (valid bit = 0). The page may
      have been swapped to disk or never allocated. The OS must handle this
      by loading the page from disk or allocating a new frame.</li>
  <li><strong>Permission violation.</strong> The process tried to write to a
      read-only page, or user code tried to access a supervisor page. The
      OS typically sends SIGSEGV to the process.</li>
  <li><strong>The page table entry does not exist.</strong> The address is
      completely outside the process's mapped regions. This is also
      SIGSEGV.</li>
</ol>

<h3>Page Fault Handling Steps</h3>

<ol>
  <li>MMU raises an exception. The CPU saves the faulting address (in CR2
      on x86, FAR on ARM) and jumps to the page fault handler in the
      kernel.</li>
  <li>The kernel looks up the faulting address in the process's virtual
      memory area (VMA) list to determine if the access is valid.</li>
  <li>If valid, the kernel finds a free physical frame (or evicts one using
      a page replacement algorithm such as LRU or Clock).</li>
  <li>If the page was swapped out, the kernel reads it from disk into the
      new frame.</li>
  <li>The kernel updates the page table entry to point to the new frame
      with the present bit set.</li>
  <li>The kernel returns from the exception handler. The CPU re-executes
      the faulting instruction, which now succeeds.</li>
</ol>

<h3>Demand Paging and Copy-on-Write</h3>

<p><strong>Demand paging</strong> means pages are only loaded when first
accessed. When a process is created (via <code>exec</code>), the OS sets up
page table entries pointing to the executable on disk but marks them all as
not-present. Each first access triggers a page fault that loads that page.</p>

<p><strong>Copy-on-Write (COW)</strong> is used by <code>fork()</code>. After
forking, parent and child share the same physical frames, all marked
read-only. When either process writes to a shared page, a page fault occurs.
The handler copies the frame, gives the writing process its own copy, and
marks both copies writable. This makes <code>fork()</code> nearly
instantaneous even for large processes.</p>
          `,
        },
        {
          type: "video",
          id: "uyrSn3qbZ8U",
          title: "Neso Academy -- Page Fault Handling in Operating Systems",
        },
        {
          type: "resources",
          links: [
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 21 -- Beyond Physical Memory: Mechanisms",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys.pdf",
              desc: "Page faults, swap space, and page replacement policies.",
            },
            {
              type: "Article",
              title: "GeeksforGeeks -- Page Fault Handling",
              url: "https://www.geeksforgeeks.org/page-fault-handling-in-operating-system/",
              desc: "Step-by-step page fault handling with diagrams.",
            },
            {
              type: "Article",
              title: "Wikipedia -- Page Fault",
              url: "https://en.wikipedia.org/wiki/Page_fault",
              desc: "Thorough reference on hard/soft/invalid page faults.",
            },
          ],
        },
        {
          type: "text",
          html: `
<h3>The Clock (Second-Chance) Page Replacement Algorithm</h3>

<p>The practice exercise below asks you to implement the <strong>Clock</strong>
algorithm, so here is how it works. Clock is an approximation of LRU that
avoids scanning the entire page list on every replacement.</p>

<ol>
  <li>All frames are arranged in a circular buffer (like a clock face).
      A <strong>clock hand</strong> points to the current position.</li>
  <li>Each frame has a <strong>reference bit</strong> (also called a
      &ldquo;use bit&rdquo;). The MMU sets this bit to 1 whenever the page
      is accessed.</li>
  <li>When a page fault occurs and a victim must be evicted:
    <ul>
      <li>Inspect the frame at the clock hand.</li>
      <li>If its reference bit is <strong>1</strong>, give it a &ldquo;second
          chance&rdquo;: clear the bit to 0 and advance the hand.</li>
      <li>If its reference bit is <strong>0</strong>, evict this page &mdash;
          it has not been accessed since its last second chance.</li>
    </ul>
  </li>
  <li>In the worst case the hand sweeps all the way around, clearing every
      bit, and evicts the page where it started (degenerating to FIFO).</li>
</ol>

<p>Clock is used in real operating systems (including variants in Linux)
because it is O(1) amortized and requires only a single bit per frame.</p>
          `,
        },
        {
          type: "practice",
          title: "Practice Exercises -- Page Faults",
          items: [
            "<strong>Page replacement:</strong> Implement the Clock (second-chance) page replacement algorithm in C. Given a sequence of page references and a fixed number of frames, print the number of page faults.",
            "<strong>COW simulation:</strong> Write pseudocode for a fork() that uses copy-on-write. Show the page table state after fork, after the child writes page 3, and after the parent writes page 3.",
            "<strong>Working set:</strong> Given a page reference string, calculate the working set at each point in time with a window size of 4. Discuss how the working set size varies.",
            "<strong>Belady's anomaly:</strong> Construct a page reference string that demonstrates Belady's anomaly with FIFO replacement (more frames cause more faults). Verify by running your simulator.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 4: Process Management and Context Switching
    // -------------------------------------------------------------------------
    {
      id: 4,
      title: "Process Management and Context Switching",
      subtitle: "How the OS juggles multiple processes on a single CPU",
      duration: "90 min",
      content: [
        {
          type: "text",
          html: `
<h2>What Is a Process?</h2>

<p>A <strong>process</strong> is an instance of a running program. It is much
more than the code &mdash; it includes:</p>

<ul>
  <li><strong>Address space:</strong> The virtual memory layout (code, data,
      heap, stack).</li>
  <li><strong>Registers:</strong> The values of all CPU registers, including
      the program counter (PC) and stack pointer (SP).</li>
  <li><strong>Open files:</strong> A table of file descriptors.</li>
  <li><strong>Process state:</strong> Running, Ready, Blocked, Zombie, etc.</li>
  <li><strong>Process ID (PID):</strong> A unique integer identifying this
      process.</li>
</ul>

<p>All of this is stored in a kernel data structure called the <strong>Process
Control Block (PCB)</strong>.</p>

<h2>Process States</h2>

<pre><code>
  +-------+      schedule      +--------+
  | Ready | -----------------> | Running |
  +-------+ <----------------- +--------+
     ^         preempt / yield       |
     |                               | I/O request
     |         I/O complete          v
     +------------------------  +--------+
                                | Blocked |
                                +--------+
</code></pre>

<ul>
  <li><strong>Running:</strong> Currently executing on a CPU core.</li>
  <li><strong>Ready:</strong> Can run but is waiting for the scheduler to
      pick it.</li>
  <li><strong>Blocked:</strong> Waiting for an event (I/O, lock, signal).</li>
  <li><strong>Zombie:</strong> Has exited but its parent has not yet called
      <code>wait()</code> to collect its exit status.</li>
</ul>

<h2>Context Switching</h2>

<p>A <strong>context switch</strong> is the mechanism by which the OS stops
one process and starts another. Here is exactly what happens on a typical
ARM system:</p>

<ol>
  <li>A timer interrupt fires (or the running process makes a system call
      or yields).</li>
  <li>The CPU automatically saves the program counter and status register
      onto the kernel stack.</li>
  <li>The interrupt handler saves all remaining general-purpose registers
      (r0&ndash;r12, sp, lr on ARM) into the current process's PCB.</li>
  <li>The scheduler selects the next process to run.</li>
  <li>The handler loads the saved registers from the new process's PCB.</li>
  <li>The handler sets the page table base register (TTBR) to the new
      process's page table, flushing the TLB (or changing the ASID).</li>
  <li>The handler returns from the interrupt, which restores the PC and
      status register &mdash; now pointing at the new process's code.</li>
</ol>

<p>The new process resumes exactly where it left off, completely unaware
that it was ever stopped.</p>

<h3>Context Switch Overhead</h3>

<p>A context switch typically takes 1&ndash;10 microseconds. The direct cost
includes saving/restoring registers and flushing the TLB. The indirect cost
is <strong>cache pollution</strong> &mdash; the new process's data is not
in the L1/L2 caches yet, causing many cache misses.</p>
          `,
        },
        {
          type: "code",
          label: "Simplified context switch (ARM assembly pseudocode)",
          code: `; context_switch(old_pcb, new_pcb)
; Save current process state
context_switch:
    ; r0 = pointer to old PCB, r1 = pointer to new PCB
    stmia   r0, {r0-r12, sp, lr}    ; Save all registers into old PCB
    mrs     r2, cpsr
    str     r2, [r0, #60]           ; Save status register

    ; Load new process state
    ldr     r2, [r1, #60]           ; Load new status register
    msr     cpsr, r2
    ldmia   r1, {r0-r12, sp, lr}    ; Restore all registers from new PCB

    ; Update page table base register
    mcr     p15, 0, r3, c2, c0, 0   ; Write TTBR0 with new page table

    ; Invalidate TLB
    mcr     p15, 0, r0, c8, c7, 0   ; Flush entire TLB

    bx      lr                       ; Return into new process`,
        },
        {
          type: "video",
          id: "DKmBRl8j3Ak",
          title: "Neso Academy -- Process Management and Process States",
        },
        {
          type: "video",
          id: "2CqLPRZJvYA",
          title: "CS 162 (UC Berkeley) -- Context Switching Explained",
        },
        {
          type: "resources",
          links: [
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 4 -- The Abstraction: The Process",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf",
              desc: "What a process is, PCB, and process states.",
            },
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 6 -- Mechanism: Limited Direct Execution",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf",
              desc: "How the OS regains control via timer interrupts and does context switching.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- Context Switching",
              url: "https://wiki.osdev.org/Context_Switching",
              desc: "Practical context switch implementation for x86 and ARM.",
            },
            {
              type: "Article",
              title: "GeeksforGeeks -- Context Switching in OS",
              url: "https://www.geeksforgeeks.org/context-switch-in-operating-system/",
              desc: "Step-by-step explanation with diagrams.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Process Management",
          items: [
            "<strong>PCB design:</strong> Define a C struct for a Process Control Block that includes PID, state, registers (r0-r15), page table pointer, open file table (up to 16 fds), parent PID, and exit code. Write functions <code>pcb_create()</code> and <code>pcb_destroy()</code>.",
            "<strong>Process list:</strong> Implement a doubly-linked list of PCBs with functions <code>ready_queue_push()</code>, <code>ready_queue_pop()</code>, and <code>ready_queue_print()</code>.",
            "<strong>Context switch cost:</strong> On a Linux system, write a C program that uses <code>clock_gettime()</code> to measure the overhead of a context switch by rapidly <code>pipe</code>-ing single bytes between two processes. How does the measured time compare to a raw function call?",
            "<strong>State diagram:</strong> Draw the complete process state diagram including Created, Ready, Running, Blocked, Zombie, and Terminated. Label every edge with the event or system call that triggers the transition.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 5: Preemptive Multitasking and Scheduling
    // -------------------------------------------------------------------------
    {
      id: 5,
      title: "Preemptive Multitasking and Scheduling",
      subtitle: "Round-robin scheduling driven by a timer interrupt",
      duration: "75 min",
      content: [
        {
          type: "text",
          html: `
<h2>Cooperative vs. Preemptive Multitasking</h2>

<p>In <strong>cooperative multitasking</strong>, each process voluntarily
yields the CPU by calling <code>yield()</code>. If a process enters an
infinite loop, it hangs the entire system. Classic Mac OS and Windows 3.1
worked this way.</p>

<p>In <strong>preemptive multitasking</strong>, a hardware <strong>timer
interrupt</strong> fires at regular intervals (typically every 1&ndash;10 ms).
The interrupt forces the CPU into the kernel, which can then decide to switch
to a different process. No process can monopolize the CPU.</p>

<h2>Round-Robin Scheduling</h2>

<p>Round-robin is the simplest preemptive scheduling algorithm:</p>

<ol>
  <li>All ready processes sit in a FIFO queue.</li>
  <li>The scheduler takes the process at the front of the queue and runs it.</li>
  <li>When the timer interrupt fires (after one <strong>time quantum</strong>,
      e.g., 10 ms), the running process is moved to the back of the queue.</li>
  <li>The next process at the front of the queue gets the CPU.</li>
  <li>If a process finishes or blocks before its quantum expires, the
      scheduler immediately picks the next process.</li>
</ol>

<h3>Choosing the Time Quantum</h3>

<p>The time quantum (or time slice) has a significant impact:</p>

<ul>
  <li><strong>Too large</strong> (e.g., 500 ms): The system feels
      unresponsive. Processes wait a long time for their turn.</li>
  <li><strong>Too small</strong> (e.g., 0.1 ms): Context switch overhead
      dominates. The CPU spends more time switching than doing useful work.</li>
  <li><strong>Typical values:</strong> 1&ndash;100 ms. Linux uses a more
      sophisticated scheme (CFS with virtual runtimes), but the concept is
      the same.</li>
</ul>

<h3>Setting Up a Timer Interrupt</h3>

<p>On ARM, you typically use the <strong>System Timer</strong> or a
<strong>Generic Timer</strong>. On x86, you use the <strong>Programmable
Interval Timer (PIT)</strong> or the <strong>APIC Timer</strong>. The steps
are:</p>

<ol>
  <li>Program the timer hardware to fire an interrupt at the desired rate.</li>
  <li>Register the timer interrupt handler in the interrupt vector table.</li>
  <li>In the handler: acknowledge the interrupt, call the scheduler, and
      perform a context switch if the scheduler selects a different process.</li>
</ol>

<h3>Other Scheduling Algorithms</h3>

<table>
  <tr><th>Algorithm</th><th>Description</th><th>Pro</th><th>Con</th></tr>
  <tr><td>FCFS</td><td>First Come First Served</td><td>Simple</td><td>Convoy effect</td></tr>
  <tr><td>SJF</td><td>Shortest Job First</td><td>Optimal avg wait</td><td>Requires knowing burst time</td></tr>
  <tr><td>Priority</td><td>Highest priority runs first</td><td>Flexible</td><td>Starvation</td></tr>
  <tr><td>Round-Robin</td><td>FIFO with time quantum</td><td>Fair, no starvation</td><td>Higher avg turnaround than SJF</td></tr>
  <tr><td>MLFQ</td><td>Multi-Level Feedback Queue</td><td>Adapts to behavior</td><td>Complex</td></tr>
</table>

<h3>Key Scheduling Metrics</h3>

<ul>
  <li><strong>Turnaround time</strong> = Completion time &minus; Arrival time.
      Total time from when a process arrives to when it finishes. Includes
      both waiting and execution.</li>
  <li><strong>Waiting time</strong> = Turnaround time &minus; Burst time.
      Time spent in the ready queue, not executing.</li>
  <li><strong>Response time</strong> = First-run time &minus; Arrival time.
      Time from arrival until the process first gets the CPU. Critical for
      interactive systems.</li>
</ul>

<h3>Worked Example: Round-Robin with Quantum = 3</h3>

<p>Three processes arrive at time 0:</p>

<table>
  <tr><th>Process</th><th>Arrival</th><th>Burst</th></tr>
  <tr><td>P1</td><td>0</td><td>5</td></tr>
  <tr><td>P2</td><td>0</td><td>3</td></tr>
  <tr><td>P3</td><td>0</td><td>7</td></tr>
</table>

<p><strong>Gantt chart</strong> (time quantum = 3):</p>
<pre><code>
Time:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
      |---P1---|---P2---|---P3---|--P1--|---P3----|
       P1(3)    P2(3)    P3(3)   P1(2)   P3(4)

t=0:  P1 runs for 3 (remaining: 2). Queue: [P2, P3]
t=3:  P2 runs for 3 (remaining: 0). Done! Queue: [P3, P1]
t=6:  P3 runs for 3 (remaining: 4). Queue: [P1, P3]
t=9:  P1 runs for 2 (remaining: 0). Done! Queue: [P3]
t=11: P3 runs for 4 (remaining: 0). Done!
</code></pre>

<table>
  <tr><th>Process</th><th>Completion</th><th>Turnaround</th><th>Waiting</th><th>Response</th></tr>
  <tr><td>P1</td><td>11</td><td>11 &minus; 0 = 11</td><td>11 &minus; 5 = 6</td><td>0 &minus; 0 = 0</td></tr>
  <tr><td>P2</td><td>6</td><td>6 &minus; 0 = 6</td><td>6 &minus; 3 = 3</td><td>3 &minus; 0 = 3</td></tr>
  <tr><td>P3</td><td>15</td><td>15 &minus; 0 = 15</td><td>15 &minus; 7 = 8</td><td>6 &minus; 0 = 6</td></tr>
</table>

<p>Averages: turnaround = (11+6+15)/3 = 10.67, waiting = (6+3+8)/3 = 5.67,
response = (0+3+6)/3 = 3.0.</p>
          `,
        },
        {
          type: "code",
          label: "Round-robin scheduler pseudocode",
          code: `// Round-Robin Scheduler (pseudocode in C-like syntax)

struct process {
    int pid;
    int burst_remaining;
    int arrival_time;
};

// ready_queue is a FIFO queue of process pointers
Queue ready_queue;
int time_quantum = 3;
int clock = 0;

void schedule(struct process procs[], int n) {
    // Enqueue all processes that have arrived at time 0
    for (int i = 0; i < n; i++) {
        if (procs[i].arrival_time <= clock)
            enqueue(&ready_queue, &procs[i]);
    }

    while (!queue_empty(&ready_queue)) {
        struct process *p = dequeue(&ready_queue);

        // Run for min(quantum, remaining burst)
        int run_time = min(time_quantum, p->burst_remaining);
        printf("t=%d: P%d runs for %d\\n", clock, p->pid, run_time);
        clock += run_time;
        p->burst_remaining -= run_time;

        // Enqueue any newly arrived processes
        for (int i = 0; i < n; i++) {
            if (procs[i].arrival_time > clock - run_time &&
                procs[i].arrival_time <= clock &&
                procs[i].burst_remaining > 0)
                enqueue(&ready_queue, &procs[i]);
        }

        // Re-enqueue current process if not finished
        if (p->burst_remaining > 0) {
            enqueue(&ready_queue, p);
        } else {
            printf("P%d completed at t=%d\\n", p->pid, clock);
        }
    }
}`,
        },
        {
          type: "video",
          id: "TxjIlNYRZ5M",
          title: "Neso Academy -- Round Robin Scheduling Algorithm",
        },
        {
          type: "resources",
          links: [
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 7 -- Scheduling: Introduction",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf",
              desc: "FIFO, SJF, Round-Robin with turnaround and response time analysis.",
            },
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 8 -- Multi-Level Feedback Queue",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf",
              desc: "The scheduler that tries to be both fair and efficient.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- Scheduling Algorithms",
              url: "https://wiki.osdev.org/Scheduling_Algorithms",
              desc: "Practical scheduling implementation for OS developers.",
            },
            {
              type: "Article",
              title: "Guru99 -- Round Robin Scheduling Example",
              url: "https://www.guru99.com/round-robin-scheduling-example.html",
              desc: "Worked examples with Gantt charts.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Scheduling",
          items: [
            "<strong>Round-robin simulation:</strong> Write a C program that simulates round-robin scheduling. Input: a list of (arrival_time, burst_time) pairs and a time quantum. Output: a Gantt chart and the average waiting time and turnaround time.",
            "<strong>Quantum analysis:</strong> Run your simulator with the processes (0,10), (2,5), (4,8) and time quanta of 1, 3, 5, and 20. Plot how average turnaround time changes with quantum size.",
            "<strong>Timer interrupt:</strong> On a Raspberry Pi (or QEMU virt machine), write a bare-metal program that configures the ARM Generic Timer to fire every 100 ms and toggles an LED (or prints a message) in the handler.",
            "<strong>Compare algorithms:</strong> Extend your simulator to also support FCFS and SJF. For a given process set, compare the three algorithms on average waiting time, turnaround time, and response time.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 6: System Calls
    // -------------------------------------------------------------------------
    {
      id: 6,
      title: "System Calls: fork, exec, open, read, write, close, exit, wait",
      subtitle: "The interface between user programs and the kernel",
      duration: "90 min",
      content: [
        {
          type: "text",
          html: `
<h2>What Is a System Call?</h2>

<p>A <strong>system call</strong> (syscall) is how a user-mode program requests
a service from the kernel. User code cannot directly access hardware, manage
memory, or create processes &mdash; it must ask the kernel via a syscall.</p>

<h3>How a System Call Works (ARM)</h3>

<ol>
  <li>The user program places the syscall number in a register (e.g., r7
      on ARM Linux) and arguments in r0&ndash;r5.</li>
  <li>It executes the <code>SVC</code> (Supervisor Call) instruction.</li>
  <li>This triggers a software interrupt that switches the CPU from user
      mode to supervisor (kernel) mode.</li>
  <li>The kernel's SVC handler looks up the syscall number in a table and
      calls the corresponding kernel function.</li>
  <li>The kernel function does the work (e.g., creates a process, reads
      a file).</li>
  <li>The return value is placed in r0 and the kernel returns to user mode.</li>
</ol>

<h2>The Essential Unix System Calls</h2>

<h3>fork() -- Create a new process</h3>
<p><code>pid_t fork(void)</code> creates a copy of the calling process.
The new process (child) is an almost-exact duplicate: same code, same data,
same open file descriptors. The only difference is the return value:
<code>fork()</code> returns the child's PID to the parent and 0 to the
child.</p>

<p>After <code>fork()</code>, parent and child share physical pages using
copy-on-write. Only when one writes does the kernel copy the page.</p>

<h3>exec() -- Replace process image</h3>
<p><code>int execve(const char *path, char *const argv[], char *const envp[])</code>
replaces the current process's code, data, and stack with a new program loaded
from <code>path</code>. The PID stays the same. Open file descriptors survive
(unless marked close-on-exec).</p>

<p>The <strong>fork-exec pattern</strong> is the Unix way to start a new
program: fork a child, then have the child call exec. The parent can wait
for the child or continue in parallel.</p>

<h3>open() -- Open a file</h3>
<p><code>int open(const char *path, int flags, mode_t mode)</code> returns a
<strong>file descriptor</strong> &mdash; a small non-negative integer that
refers to an entry in the kernel's open-file table. Flags include
<code>O_RDONLY</code>, <code>O_WRONLY</code>, <code>O_RDWR</code>,
<code>O_CREAT</code>, <code>O_TRUNC</code>.</p>

<h3>read() and write()</h3>
<p><code>ssize_t read(int fd, void *buf, size_t count)</code> reads up to
<code>count</code> bytes from fd into buf. Returns the number of bytes
actually read (0 at EOF, -1 on error).</p>
<p><code>ssize_t write(int fd, const void *buf, size_t count)</code> writes
up to <code>count</code> bytes from buf to fd.</p>

<h3>close() -- Release a file descriptor</h3>
<p><code>int close(int fd)</code> releases the file descriptor. The kernel
decrements the reference count on the underlying file; if it reaches zero,
the file is truly closed.</p>

<h3>exit() -- Terminate the process</h3>
<p><code>void _exit(int status)</code> terminates the calling process. The
exit status is stored for the parent to collect. All open file descriptors
are closed, memory is freed, but the PCB remains as a <strong>zombie</strong>
until the parent calls <code>wait()</code>.</p>

<h3>wait() -- Wait for a child</h3>
<p><code>pid_t wait(int *status)</code> blocks the parent until any child
process terminates. It returns the child's PID and stores the exit status
in <code>*status</code>. This is how the parent reaps zombies.</p>
          `,
        },
        {
          type: "code",
          label: "fork-exec example in C",
          code: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();

    if (pid < 0) {
        perror("fork failed");
        return 1;
    }

    if (pid == 0) {
        // Child process
        printf("Child (PID %d): about to exec 'ls'\\n", getpid());
        char *args[] = {"ls", "-la", NULL};
        execvp("ls", args);
        // If execvp returns, it failed
        perror("execvp failed");
        _exit(1);
    }

    // Parent process
    printf("Parent (PID %d): waiting for child %d\\n", getpid(), pid);
    int status;
    waitpid(pid, &status, 0);

    if (WIFEXITED(status)) {
        printf("Parent: child exited with status %d\\n",
               WEXITSTATUS(status));
    }
    return 0;
}`,
        },
        {
          type: "video",
          id: "ss1_JtHdOCg",
          title: "Jacob Sorber -- fork() and exec() Explained",
        },
        {
          type: "video",
          id: "IFEFVXvjiHY",
          title: "CS 162 (UC Berkeley) -- System Calls and Processes",
        },
        {
          type: "resources",
          links: [
            {
              type: "Textbook (free)",
              title: "OSTEP Ch. 5 -- Interlude: Process API",
              url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-api.pdf",
              desc: "Covers fork, exec, wait with complete C examples.",
            },
            {
              type: "Article",
              title: "GeeksforGeeks -- I/O System Calls (open, read, write, close)",
              url: "https://www.geeksforgeeks.org/input-output-system-calls-c-create-open-close-read-write/",
              desc: "Complete tutorial on file I/O system calls in C.",
            },
            {
              type: "Tutorial",
              title: "YoLinux -- Fork, Exec and Process Control",
              url: "http://www.yolinux.com/TUTORIALS/ForkExecProcesses.html",
              desc: "Practical fork-exec tutorial with many examples.",
            },
            {
              type: "Article",
              title: "Linux man pages -- fork(2), exec(3), wait(2)",
              url: "https://man7.org/linux/man-pages/man2/fork.2.html",
              desc: "The authoritative reference for every system call.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- System Calls",
          items: [
            "<strong>Fork tree:</strong> Write a program that calls fork() three times. How many processes exist at the end? Draw the process tree.",
            "<strong>Fork-exec shell command:</strong> Write a C program that takes a command and its arguments from argv, forks a child, execs the command in the child, and waits for it in the parent. Print the child's exit status.",
            "<strong>File copy:</strong> Write a C program that copies a file using only open(), read(), write(), and close(). Do not use stdio (fopen, fread, etc.). Use a 4096-byte buffer.",
            "<strong>Pipe between processes:</strong> Write a C program that creates a pipe, forks, has the child write 'Hello from child!' into the pipe, and has the parent read and print it.",
            "<strong>Zombie observation:</strong> Write a program that forks a child, has the child exit immediately, and has the parent sleep for 30 seconds before calling wait(). While the parent sleeps, run <code>ps aux | grep Z</code> in another terminal to observe the zombie.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 7: The Unix Process Model
    // -------------------------------------------------------------------------
    {
      id: 7,
      title: "The Unix Process Model",
      subtitle: "Process trees, init, orphans, zombies, and signals",
      duration: "60 min",
      content: [
        {
          type: "text",
          html: `
<h2>The Unix Process Hierarchy</h2>

<p>Every Unix system has a strict process hierarchy rooted at
<strong>init</strong> (PID 1, or <code>systemd</code> on modern Linux).
Init is the first user-space process started by the kernel at boot. Every
other process is a descendant of init.</p>

<h3>The Fork-Exec Model</h3>

<p>Unix creates new processes in two steps:</p>

<ol>
  <li><code>fork()</code> creates a copy of the current process.</li>
  <li><code>exec()</code> replaces the copy's code with a new program.</li>
</ol>

<p>This separation is powerful because between fork and exec the child can
modify its own environment: redirect file descriptors, change the working
directory, set environment variables, drop privileges. This is how the shell
implements I/O redirection and pipes.</p>

<h3>Process Groups and Sessions</h3>

<p>Processes are organized into <strong>process groups</strong> (for job
control) and <strong>sessions</strong> (tied to a controlling terminal). When
you type <code>Ctrl-C</code>, the kernel sends SIGINT to every process in the
foreground process group, not just the shell.</p>

<h3>Orphans and Zombies</h3>

<p><strong>Orphan:</strong> A process whose parent has terminated. The kernel
re-parents orphans to init (PID 1), which periodically calls <code>wait()</code>
to clean them up.</p>

<p><strong>Zombie:</strong> A process that has exited but whose parent has not
yet called <code>wait()</code>. The zombie's PCB remains in the process table
(consuming a PID and a small amount of kernel memory) until the parent reaps
it. A system flooded with zombies can run out of PIDs.</p>

<h3>Signals</h3>

<p>Signals are a mechanism for asynchronous notification:</p>

<table>
  <tr><th>Signal</th><th>Default Action</th><th>Meaning</th></tr>
  <tr><td>SIGINT</td><td>Terminate</td><td>Interrupt from keyboard (Ctrl-C)</td></tr>
  <tr><td>SIGTERM</td><td>Terminate</td><td>Polite termination request</td></tr>
  <tr><td>SIGKILL</td><td>Terminate</td><td>Forced kill (cannot be caught)</td></tr>
  <tr><td>SIGSEGV</td><td>Core dump</td><td>Segmentation fault</td></tr>
  <tr><td>SIGCHLD</td><td>Ignore</td><td>Child process stopped or terminated</td></tr>
  <tr><td>SIGSTOP</td><td>Stop</td><td>Stop process (cannot be caught)</td></tr>
  <tr><td>SIGCONT</td><td>Continue</td><td>Resume stopped process</td></tr>
</table>

<p>A process can install a custom <strong>signal handler</strong> function for
most signals using <code>signal()</code> or <code>sigaction()</code>. SIGKILL
and SIGSTOP cannot be caught or ignored.</p>

<h3>Sessions and Terminal Control</h3>

<p>A <strong>session</strong> is a collection of one or more process groups
tied to a single controlling terminal. The function <code>setsid()</code>
creates a new session:</p>

<ul>
  <li>The calling process becomes the <strong>session leader</strong> and the
      leader of a new process group.</li>
  <li>The process has <strong>no controlling terminal</strong> (it is
      detached).</li>
  <li>This is the key step in creating a <strong>daemon</strong>: fork, have
      the parent exit, and call <code>setsid()</code> in the child so it is
      no longer associated with the original terminal.</li>
</ul>

<p>The controlling terminal sends signals to the foreground process group.
When the terminal hangs up, SIGHUP is sent to the session leader. This is
why background processes started from a shell die when you close the
terminal &mdash; unless they have called <code>setsid()</code> or are run
under <code>nohup</code>.</p>

<h3>Sending Signals with kill()</h3>

<p><code>int kill(pid_t pid, int sig)</code> sends signal <code>sig</code> to
process <code>pid</code>. Despite its name, it can send <em>any</em> signal,
not just lethal ones. Special pid values:</p>
<ul>
  <li><code>pid &gt; 0</code> &mdash; send to that specific process.</li>
  <li><code>pid == 0</code> &mdash; send to every process in the caller's
      process group.</li>
  <li><code>pid == -1</code> &mdash; send to every process the caller has
      permission to signal.</li>
  <li><code>pid &lt; -1</code> &mdash; send to every process in process
      group <code>|pid|</code>.</li>
</ul>

<h3>Reaping Children: SIGCHLD + waitpid Pattern</h3>

<p>When a child exits, the kernel sends <strong>SIGCHLD</strong> to the
parent. The default action is to ignore it, which leaves zombies. The
correct pattern for servers and shells that spawn many children is:</p>

<ol>
  <li>Install a SIGCHLD handler using <code>sigaction()</code>.</li>
  <li>In the handler, call <code>waitpid(-1, &amp;status, WNOHANG)</code>
      in a loop. <code>-1</code> means &ldquo;any child,&rdquo;
      <code>WNOHANG</code> means &ldquo;do not block if no child has
      exited yet.&rdquo;</li>
  <li>Loop until <code>waitpid</code> returns 0 (no more exited children)
      or -1 (error). This is essential because multiple children may exit
      before the handler runs &mdash; signals are not queued.</li>
</ol>
          `,
        },
        {
          type: "code",
          label: "sigaction() with SIGCHLD handler for reaping children",
          code: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <errno.h>

/* SIGCHLD handler: reap all exited children without blocking */
void sigchld_handler(int sig) {
    (void)sig;
    int saved_errno = errno;  /* save errno -- handler must not clobber it */
    pid_t pid;
    int status;

    /* Loop: multiple children may have exited (signals coalesce) */
    while ((pid = waitpid(-1, &status, WNOHANG)) > 0) {
        if (WIFEXITED(status))
            printf("  [reaped child %d, exit=%d]\\n", pid, WEXITSTATUS(status));
        else if (WIFSIGNALED(status))
            printf("  [reaped child %d, killed by signal %d]\\n", pid, WTERMSIG(status));
    }
    errno = saved_errno;
}

int main(void) {
    /* Install SIGCHLD handler using sigaction (preferred over signal()) */
    struct sigaction sa;
    sa.sa_handler = sigchld_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART | SA_NOCLDSTOP;
    /*  SA_RESTART  -- restart interrupted system calls automatically
     *  SA_NOCLDSTOP -- only notify on termination, not on stop/continue */
    if (sigaction(SIGCHLD, &sa, NULL) == -1) {
        perror("sigaction");
        exit(1);
    }

    /* Spawn 3 children */
    for (int i = 0; i < 3; i++) {
        pid_t pid = fork();
        if (pid == 0) {
            printf("Child %d (PID %d) running\\n", i, getpid());
            sleep(i + 1);  /* each child sleeps a different duration */
            _exit(i);
        }
        printf("Parent spawned child PID %d\\n", pid);
    }

    /* Send SIGTERM to a specific child using kill() */
    /* kill(some_pid, SIGTERM); */

    /* Parent does other work; children are reaped asynchronously */
    printf("Parent doing work... children will be reaped by SIGCHLD handler\\n");
    sleep(5);
    printf("Parent exiting\\n");
    return 0;
}`,
        },
        {
          type: "code",
          label: "Sending signals with kill() and creating a daemon with setsid()",
          code: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>

/* --- Example 1: Sending signals with kill() --- */
void send_signal_example(void) {
    pid_t pid = fork();
    if (pid == 0) {
        /* Child: sleep and wait to be signaled */
        printf("Child PID %d waiting...\\n", getpid());
        pause();  /* blocks until a signal is received */
        _exit(0);
    }
    sleep(1);
    printf("Parent sending SIGTERM to child %d\\n", pid);
    kill(pid, SIGTERM);  /* send SIGTERM to child */
    waitpid(pid, NULL, 0);
    printf("Child terminated\\n");
}

/* --- Example 2: Creating a daemon with setsid() --- */
void daemonize(void) {
    pid_t pid = fork();
    if (pid < 0) { perror("fork"); exit(1); }
    if (pid > 0) _exit(0);  /* parent exits */

    /* Child continues: create new session */
    if (setsid() < 0) { perror("setsid"); exit(1); }
    /*  Now this process is:
     *    - session leader of a new session
     *    - process group leader of a new group
     *    - has no controlling terminal            */

    /* Close inherited file descriptors */
    close(STDIN_FILENO);
    close(STDOUT_FILENO);
    close(STDERR_FILENO);

    /* Daemon work loop */
    while (1) {
        /* ... do background work, log to a file ... */
        sleep(30);
    }
}`,
        },
        {
          type: "video",
          id: "xHu7qI1gDPA",
          title: "Brian Will -- Unix Processes (Process Creation, Signals, etc.)",
        },
        {
          type: "resources",
          links: [
            {
              type: "Article",
              title: "Linux Journal -- The Linux Process Model",
              url: "https://www.linuxjournal.com/article/3814",
              desc: "In-depth article covering the Linux process model.",
            },
            {
              type: "Tutorial",
              title: "TutorialsPoint -- Unix Processes",
              url: "https://www.tutorialspoint.com/unix/unix-processes.htm",
              desc: "Beginner-friendly overview of Unix process concepts.",
            },
            {
              type: "Article",
              title: "GeeksforGeeks -- Processes in Linux/Unix",
              url: "https://www.geeksforgeeks.org/processes-in-linuxunix/",
              desc: "Process creation, zombie and orphan processes explained.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Unix Process Model",
          items: [
            "<strong>Process tree:</strong> Run <code>pstree -p</code> on a Linux system and identify init/systemd, your shell, and processes you launched. Explain the parent-child relationships.",
            "<strong>Signal handler:</strong> Write a C program that installs a handler for SIGINT using <code>sigaction()</code>. When the user presses Ctrl-C, print 'Caught SIGINT!' but do not exit. Make the program exit cleanly when it receives SIGINT three times.",
            "<strong>Orphan experiment:</strong> Write a program that forks a child, has the parent exit immediately, and has the child print its PPID every second for 5 seconds. Observe that the PPID changes to 1 (init) after the parent exits.",
            "<strong>Daemon:</strong> Write a simple daemon process: fork, have the parent exit, call setsid() in the child, close stdin/stdout/stderr, and write a message to a log file every 5 seconds.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 8: Interrupt Handling
    // -------------------------------------------------------------------------
    {
      id: 8,
      title: "Interrupt Handling",
      subtitle: "How hardware and software interrupts drive the OS",
      duration: "75 min",
      content: [
        {
          type: "text",
          html: `
<h2>What Is an Interrupt?</h2>

<p>An <strong>interrupt</strong> is a signal to the CPU that something needs
immediate attention. The CPU suspends its current work, saves enough state to
resume later, and jumps to a pre-registered handler function. When the handler
finishes, the CPU resumes the interrupted code.</p>

<h3>Types of Interrupts</h3>

<ul>
  <li><strong>Hardware interrupts (IRQs):</strong> Generated by external
      devices &mdash; keyboard, disk controller, network card, timer. These
      are truly asynchronous and can arrive at any time.</li>
  <li><strong>Software interrupts (traps):</strong> Generated intentionally
      by instructions like <code>SVC</code> (ARM) or <code>INT 0x80</code>
      (x86). Used for system calls.</li>
  <li><strong>Exceptions:</strong> Generated by the CPU itself when something
      goes wrong &mdash; divide by zero, page fault, undefined instruction,
      alignment fault.</li>
</ul>

<h3>The Interrupt Vector Table</h3>

<p>The CPU needs to know <em>where</em> to jump for each interrupt. This
information is stored in the <strong>Interrupt Vector Table (IVT)</strong>
(or Interrupt Descriptor Table on x86). It is an array of function pointers,
one per interrupt number.</p>

<p>On ARM, the vector table is at address 0x00000000 (or 0xFFFF0000 in high-
vector mode) and has a fixed layout:</p>

<pre><code>
Address   Exception
0x00      Reset
0x04      Undefined Instruction
0x08      Software Interrupt (SVC)
0x0C      Prefetch Abort
0x10      Data Abort
0x14      Reserved
0x18      IRQ
0x1C      FIQ
</code></pre>

<h3>Interrupt Handling Flow</h3>

<ol>
  <li>Device asserts an interrupt line connected to the <strong>Interrupt
      Controller</strong> (GIC on ARM, APIC on x86).</li>
  <li>The interrupt controller signals the CPU and provides the interrupt
      number.</li>
  <li>The CPU finishes the current instruction, saves PC and CPSR to the
      banked registers (on ARM) or pushes them to the stack (on x86).</li>
  <li>The CPU switches to the appropriate mode (IRQ mode on ARM, ring 0
      on x86) and jumps to the vector table entry.</li>
  <li>The handler (ISR) runs: saves additional registers, determines
      which device interrupted, services the device, and acknowledges the
      interrupt.</li>
  <li>The handler restores registers and executes a return-from-interrupt
      instruction (<code>SUBS PC, LR, #4</code> on ARM, <code>IRET</code>
      on x86).</li>
</ol>

<h3>Top Half and Bottom Half</h3>

<p>To keep interrupt handlers fast, work is split into:</p>
<ul>
  <li><strong>Top half:</strong> Runs in interrupt context with interrupts
      disabled. Does the bare minimum: read device status, acknowledge
      interrupt, schedule deferred work.</li>
  <li><strong>Bottom half:</strong> Runs later with interrupts enabled.
      Does the heavy processing (e.g., processing network packets,
      copying disk data to user buffers).</li>
</ul>
          `,
        },
        {
          type: "video",
          id: "DlEa8kd7n3Q",
          title: "Neso Academy -- Interrupts in Operating Systems",
        },
        {
          type: "resources",
          links: [
            {
              type: "Article",
              title: "GeeksforGeeks -- Interrupts in OS",
              url: "https://www.geeksforgeeks.org/interrupts/",
              desc: "Types of interrupts, ISR, and IVT explained.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- Interrupts",
              url: "https://wiki.osdev.org/Interrupts",
              desc: "Practical interrupt setup for OS developers.",
            },
            {
              type: "Course",
              title: "Linux Kernel Labs -- Interrupts",
              url: "https://linux-kernel-labs.github.io/refs/heads/master/lectures/interrupts.html",
              desc: "How Linux implements interrupt handling internally.",
            },
            {
              type: "Textbook",
              title: "Valvano -- Chapter 12: Interrupts (Embedded Systems)",
              url: "https://users.ece.utexas.edu/~valvano/Volume1/E-Book/C12_Interrupts.htm",
              desc: "Interrupts for ARM Cortex-M with hands-on examples.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Interrupts",
          items: [
            "<strong>Vector table:</strong> Write ARM assembly that sets up a minimal vector table with entries for Reset, SVC, and IRQ. The Reset handler should initialize the stack pointer and branch to a C <code>main()</code> function.",
            "<strong>SVC handler:</strong> Write an SVC handler in ARM assembly that reads the syscall number from r7, dispatches to a C function based on a table lookup, and returns the result in r0.",
            "<strong>Timer interrupt:</strong> On QEMU (ARM virt machine), configure a timer to fire every 100 ms. In the IRQ handler, increment a global counter and print it. Run for 5 seconds and verify you get ~50 interrupts.",
            "<strong>Nested interrupts:</strong> Research and explain: What happens if another interrupt arrives while an ISR is running? How do interrupt priorities and interrupt nesting work on ARM's GIC?",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 9: Device Drivers Basics
    // -------------------------------------------------------------------------
    {
      id: 9,
      title: "Device Drivers Basics",
      subtitle: "The software that talks to hardware",
      duration: "60 min",
      content: [
        {
          type: "text",
          html: `
<h2>What Is a Device Driver?</h2>

<p>A <strong>device driver</strong> is a kernel module that manages the
low-level I/O operations of a hardware device. Its purpose is
<strong>abstraction</strong>: it presents a clean, uniform interface
(typically read/write/ioctl) to the rest of the kernel and to user
programs, hiding the messy details of the hardware protocol.</p>

<h3>Driver Categories</h3>

<ul>
  <li><strong>Character devices:</strong> Handle data as a stream of bytes.
      Examples: serial port (UART), keyboard, /dev/null. Accessed via read()
      and write().</li>
  <li><strong>Block devices:</strong> Handle data in fixed-size blocks
      (sectors). Examples: hard disk, SD card. Support random access.</li>
  <li><strong>Network devices:</strong> Handle packets. Examples: Ethernet
      NIC, Wi-Fi adapter. Use a separate socket-based interface.</li>
</ul>

<h3>Memory-Mapped I/O (MMIO)</h3>

<p>On most ARM systems, hardware devices are controlled by reading and
writing to specific physical addresses. The CPU's memory bus is shared
between RAM and device registers. For example, a UART peripheral might have
its data register at address <code>0x101F1000</code> and its status register
at <code>0x101F1004</code>.</p>

<p>The driver accesses these by mapping the physical addresses into its
virtual address space (with caching disabled) and using volatile pointers.</p>

<h3>Polling vs. Interrupt-Driven I/O</h3>

<p><strong>Polling:</strong> The driver repeatedly checks the device's status
register in a loop. Simple but wastes CPU cycles.</p>

<p><strong>Interrupt-driven:</strong> The device signals the CPU via an
interrupt when it needs attention. The driver registers an ISR that handles
the event. Much more efficient for slow devices.</p>

<h3>DMA (Direct Memory Access)</h3>

<p>For high-throughput devices (disk, network), the CPU programs a
<strong>DMA controller</strong> with a source address, destination address,
and transfer length. The DMA controller transfers data directly between
the device and RAM without CPU involvement. When done, it raises an
interrupt.</p>

<h3>Anatomy of a Simple Driver</h3>

<ol>
  <li><strong>init():</strong> Called when the driver is loaded. Registers
      with the kernel, requests IRQs, maps device memory.</li>
  <li><strong>open():</strong> Called when a user opens the device file.
      May initialize hardware.</li>
  <li><strong>read() / write():</strong> Transfer data between user buffers
      and the device.</li>
  <li><strong>ioctl():</strong> Device-specific control commands.</li>
  <li><strong>close():</strong> Called when the user closes the device.
      May power down hardware.</li>
  <li><strong>ISR:</strong> Handles hardware interrupts from the device.</li>
</ol>

<h3>MMIO Access with Volatile Pointers</h3>

<p>In bare-metal and kernel code, hardware registers are accessed by casting
their physical addresses to <code>volatile</code> pointers. The
<code>volatile</code> keyword tells the compiler that the value at this
address can change at any time (because the hardware can modify it), so it
must not optimize away reads or writes:</p>

<pre><code>/* Define a UART data register at its MMIO address */
#define UART0_DR  (*(volatile uint32_t *)0x09000000)

/* Write a character */
UART0_DR = 'A';

/* Read a character */
char c = (char)UART0_DR;
</code></pre>

<p>Never access device registers through normal (non-volatile) pointers.
The compiler may cache the value in a CPU register and never re-read the
hardware, or it may eliminate a write it considers &ldquo;dead.&rdquo;</p>

<h3>PL011 UART Register Map</h3>

<p>The ARM PL011 is the UART used on QEMU's <code>virt</code> machine
(base address <code>0x09000000</code>) and on the Raspberry Pi. Its key
registers:</p>

<table>
  <tr><th>Offset</th><th>Name</th><th>Description</th></tr>
  <tr><td>0x000</td><td>DR</td><td>Data Register &mdash; write to transmit, read to receive</td></tr>
  <tr><td>0x018</td><td>FR</td><td>Flag Register &mdash; status bits (TX full, RX empty, busy)</td></tr>
  <tr><td>0x024</td><td>IBRD</td><td>Integer Baud Rate Divisor</td></tr>
  <tr><td>0x028</td><td>FBRD</td><td>Fractional Baud Rate Divisor</td></tr>
  <tr><td>0x02C</td><td>LCRH</td><td>Line Control Register &mdash; word length, parity, FIFO enable</td></tr>
  <tr><td>0x030</td><td>CR</td><td>Control Register &mdash; UART enable, TX enable, RX enable</td></tr>
</table>

<p>The Flag Register (FR) has two critical bits: <strong>TXFF</strong>
(bit 5, transmit FIFO full) and <strong>RXFE</strong> (bit 4, receive
FIFO empty). A driver polls these before writing or reading.</p>

<h3>What is ioctl?</h3>

<p><code>int ioctl(int fd, unsigned long request, ...)</code> is a catch-all
system call for device-specific operations that do not fit the
read/write model. For example, setting the baud rate of a serial port,
ejecting a CD-ROM, or querying the screen resolution of a framebuffer.
The <code>request</code> parameter is a device-specific command number,
and the optional third argument is typically a pointer to a struct with
command-specific data. Each driver defines its own set of ioctl
commands.</p>
          `,
        },
        {
          type: "code",
          label: "Minimal PL011 UART driver for QEMU ARM virt",
          code: `#include <stdint.h>

/* ---- PL011 UART registers (QEMU virt: base 0x09000000) ---- */
#define UART0_BASE  0x09000000

#define UART0_DR    (*(volatile uint32_t *)(UART0_BASE + 0x000)) /* Data       */
#define UART0_FR    (*(volatile uint32_t *)(UART0_BASE + 0x018)) /* Flags      */
#define UART0_IBRD  (*(volatile uint32_t *)(UART0_BASE + 0x024)) /* Int baud   */
#define UART0_FBRD  (*(volatile uint32_t *)(UART0_BASE + 0x028)) /* Frac baud  */
#define UART0_LCRH  (*(volatile uint32_t *)(UART0_BASE + 0x02C)) /* Line ctrl  */
#define UART0_CR    (*(volatile uint32_t *)(UART0_BASE + 0x030)) /* Control    */

/* Flag register bits */
#define FR_TXFF  (1 << 5)   /* Transmit FIFO full  */
#define FR_RXFE  (1 << 4)   /* Receive FIFO empty  */

void uart_init(void) {
    UART0_CR = 0;              /* Disable UART               */
    UART0_IBRD = 1;            /* Baud = clock / (16 * 1) -- */
    UART0_FBRD = 40;           /* exact rate depends on clock */
    UART0_LCRH = (3 << 5);    /* 8-bit word, FIFO disabled   */
    UART0_CR = (1 << 0)       /* UART enable                 */
             | (1 << 8)       /* TX enable                   */
             | (1 << 9);      /* RX enable                   */
}

void uart_putc(char c) {
    /* Wait until transmit FIFO is not full */
    while (UART0_FR & FR_TXFF)
        ;  /* spin */
    UART0_DR = c;
}

char uart_getc(void) {
    /* Wait until receive FIFO is not empty */
    while (UART0_FR & FR_RXFE)
        ;  /* spin */
    return (char)UART0_DR;
}

void uart_puts(const char *s) {
    while (*s) {
        if (*s == '\\n') uart_putc('\\r');  /* CR before LF */
        uart_putc(*s++);
    }
}

/* Entry point (called from startup assembly) */
void main(void) {
    uart_init();
    uart_puts("Hello from bare-metal UART!\\n");
    while (1) {
        char c = uart_getc();
        uart_putc(c);  /* echo back */
    }
}`,
        },
        {
          type: "video",
          id: "juGNPLdjLH4",
          title: "LiveOverflow -- Writing a Linux Kernel Module",
        },
        {
          type: "resources",
          links: [
            {
              type: "Book (free)",
              title: "Oracle -- Device Driver Basics",
              url: "https://docs.oracle.com/cd/E23824_01/html/819-3196/eqbqp.html",
              desc: "Comprehensive introduction to Solaris driver development concepts.",
            },
            {
              type: "Tutorial",
              title: "Apriorit -- Linux Device Driver Tutorial",
              url: "https://www.apriorit.com/dev-blog/195-simple-driver-for-linux-os",
              desc: "Step-by-step guide to writing a simple Linux driver.",
            },
            {
              type: "PDF",
              title: "Winthrop -- Writing Device Drivers in Linux (Brief Tutorial)",
              url: "https://faculty.winthrop.edu/domanm/csci411/Handouts/linux_device_driver_tutorial.pdf",
              desc: "Short academic tutorial on Linux driver development.",
            },
            {
              type: "Wiki",
              title: "OSDev Wiki -- Device Drivers",
              url: "https://wiki.osdev.org/Category:Hardware",
              desc: "Practical guides for writing drivers for common hardware.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Device Drivers",
          items: [
            "<strong>UART driver:</strong> Write a bare-metal UART driver for QEMU's ARM virt machine. Implement <code>uart_init()</code>, <code>uart_putc(char c)</code>, <code>uart_getc()</code>, and <code>uart_puts(const char *s)</code>. The PL011 UART is at address 0x09000000.",
            "<strong>Polling vs. interrupt:</strong> First implement uart_getc() using polling (spin on the status register). Then convert it to interrupt-driven with a receive buffer. Measure CPU usage in both cases.",
            "<strong>LED blinker:</strong> If you have a Raspberry Pi, write a bare-metal driver that toggles a GPIO pin to blink an LED. If not, use QEMU and toggle a virtual GPIO.",
            "<strong>Driver abstraction:</strong> Define a C struct <code>struct device_ops { int (*open)(void); int (*read)(char*, int); int (*write)(const char*, int); int (*close)(void); };</code> and implement it for your UART driver. Show how the kernel can call the driver through this interface without knowing it is a UART.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 10: SD Card Protocol (SPI Mode)
    // -------------------------------------------------------------------------
    {
      id: 10,
      title: "SD Card Protocol (SPI Mode)",
      subtitle: "Reading and writing storage over a simple serial bus",
      duration: "75 min",
      content: [
        {
          type: "text",
          html: `
<h2>Why SPI Mode?</h2>

<p>SD cards support two communication modes: the native <strong>SD bus mode</strong>
(4-bit parallel, complex protocol) and <strong>SPI mode</strong> (serial,
simpler protocol). For learning and for simple embedded systems, SPI mode is
far easier to implement because SPI is a standard serial bus that many
microcontrollers already support.</p>

<h3>SPI Bus Basics</h3>

<p>SPI (Serial Peripheral Interface) uses four signals:</p>

<table>
  <tr><th>Signal</th><th>Direction</th><th>Purpose</th></tr>
  <tr><td>SCLK</td><td>Master -> Slave</td><td>Clock signal</td></tr>
  <tr><td>MOSI</td><td>Master -> Slave</td><td>Master Out, Slave In (data to card)</td></tr>
  <tr><td>MISO</td><td>Slave -> Master</td><td>Master In, Slave Out (data from card)</td></tr>
  <tr><td>CS</td><td>Master -> Slave</td><td>Chip Select (active low)</td></tr>
</table>

<p>SPI is full-duplex: the master sends a byte on MOSI and simultaneously
receives a byte on MISO. The master controls the clock.</p>

<h3>SD Card Initialization Sequence</h3>

<ol>
  <li>Power on. Wait at least 1 ms.</li>
  <li>Send at least 74 clock cycles with CS high (deselected). This puts the
      card in native SD mode initially.</li>
  <li>Pull CS low and send <strong>CMD0</strong> (GO_IDLE_STATE). This resets
      the card and switches it to SPI mode. Expected response: 0x01 (idle).</li>
  <li>Send <strong>CMD8</strong> (SEND_IF_COND) to check voltage range and
      determine if the card is SDv2 or SDv1.</li>
  <li>Repeatedly send <strong>ACMD41</strong> (SD_SEND_OP_COND with HCS bit)
      until the card leaves idle state (response = 0x00). ACMD41 is an
      application-specific command preceded by CMD55.</li>
  <li>For SDHC/SDXC cards, send <strong>CMD58</strong> to read the OCR
      register and check if the card uses block addressing.</li>
</ol>

<h3>SD Card Command Format</h3>

<p>Every command is exactly 6 bytes:</p>
<pre><code>
Byte 0: 0x40 | command_number   (start bit + command index)
Byte 1-4: 32-bit argument       (big-endian)
Byte 5: CRC7 checksum | 0x01    (CRC + stop bit)
</code></pre>

<p>In SPI mode, CRC checking is off by default (except for CMD0 and CMD8
which require valid CRCs: 0x95 for CMD0, 0x87 for CMD8).</p>

<h3>Reading a Block</h3>

<ol>
  <li>Send <strong>CMD17</strong> (READ_SINGLE_BLOCK) with the block address
      as the argument.</li>
  <li>Wait for a response byte of 0x00 (success).</li>
  <li>Wait for the <strong>data token</strong> 0xFE.</li>
  <li>Read 512 bytes of data.</li>
  <li>Read 2 bytes of CRC (can be ignored in SPI mode).</li>
</ol>

<h3>Writing a Block</h3>

<ol>
  <li>Send <strong>CMD24</strong> (WRITE_BLOCK) with the block address.</li>
  <li>Wait for response 0x00.</li>
  <li>Send data token 0xFE.</li>
  <li>Send 512 bytes of data.</li>
  <li>Send 2 dummy CRC bytes.</li>
  <li>Read the <strong>data response token</strong>: (response & 0x1F) should
      be 0x05 (data accepted).</li>
  <li>Wait while the card is busy (MISO = 0x00).</li>
</ol>
          `,
        },
        {
          type: "video",
          id: "eAtZWMEJMrk",
          title: "How an SD Card Works (Physical Layer and SPI)",
        },
        {
          type: "resources",
          links: [
            {
              type: "Lecture (PDF)",
              title: "Dejazzer -- Lecture 12: SPI and SD Cards",
              url: "https://www.dejazzer.com/ee379/lecture_notes/lec12_sd_card.pdf",
              desc: "University lecture slides on SPI protocol and SD card interfacing.",
            },
            {
              type: "Tutorial",
              title: "RJH Coding -- AVR SD Card Initialization Tutorial",
              url: "http://rjhcoding.com/avrc-sd-interface-1.php",
              desc: "Detailed step-by-step SD card initialization in C for AVR.",
            },
            {
              type: "Tutorial",
              title: "STM32 SD Card SPI Tutorial (DeepBlue)",
              url: "https://deepbluembedded.com/stm32-sd-card-spi-fatfs-tutorial-examples/",
              desc: "Complete tutorial with FatFS integration.",
            },
            {
              type: "Library",
              title: "elm-chan -- FatFs (Generic FAT Module)",
              url: "https://elm-chan.org/fsw/ff/",
              desc: "The most widely used FAT library for embedded systems.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- SD Card",
          items: [
            "<strong>SPI bit-banging:</strong> Write C functions <code>spi_transfer_byte(uint8_t out)</code> and <code>spi_transfer_block(uint8_t *out, uint8_t *in, int len)</code> that bit-bang the SPI protocol using GPIO pins (or simulate the signals with printf).",
            "<strong>SD initialization:</strong> Implement the full SD card initialization sequence (CMD0, CMD8, ACMD41, CMD58) using your SPI functions. Test against a real SD card or an SD card emulator.",
            "<strong>Block read:</strong> Implement <code>sd_read_block(uint32_t block_num, uint8_t *buffer)</code> using CMD17. Read block 0 (the MBR/boot sector) and print its contents in hex.",
            "<strong>Block write:</strong> Implement <code>sd_write_block(uint32_t block_num, const uint8_t *buffer)</code> using CMD24. Write a known pattern to a block, read it back, and verify.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 11: FAT Filesystem
    // -------------------------------------------------------------------------
    {
      id: 11,
      title: "FAT Filesystem (FAT16/FAT32)",
      subtitle: "Directory entries, cluster chains, and the FAT table",
      duration: "90 min",
      content: [
        {
          type: "text",
          html: `
<h2>FAT Filesystem from First Principles</h2>

<p>The <strong>File Allocation Table (FAT)</strong> filesystem is one of the
simplest and most widely used filesystems. It was designed by Microsoft in
1977 and is still used on SD cards, USB drives, and embedded systems because
of its simplicity.</p>

<h3>Disk Layout</h3>

<p>A FAT volume is laid out in this order:</p>

<ol>
  <li><strong>Boot Sector (BPB)</strong> &mdash; The BIOS Parameter Block at
      sector 0. Contains all the metadata needed to parse the filesystem:
      bytes per sector, sectors per cluster, number of FATs, root directory
      entry count (FAT16), total sectors, FAT size, and more.</li>
  <li><strong>Reserved Sectors</strong> &mdash; Includes the boot sector.
      FAT32 has more reserved sectors than FAT16.</li>
  <li><strong>FAT Region</strong> &mdash; One or two copies of the File
      Allocation Table (usually two for redundancy).</li>
  <li><strong>Root Directory Region</strong> &mdash; (FAT16 only) A
      fixed-size area for root directory entries.</li>
  <li><strong>Data Region</strong> &mdash; Where file and directory data is
      stored, organized into <strong>clusters</strong>.</li>
</ol>

<h3>Clusters</h3>

<p>The data region is divided into fixed-size <strong>clusters</strong> (e.g.,
4 KB, 8 KB, 32 KB). Each cluster is a contiguous group of sectors. Files are
allocated in whole clusters. A 1-byte file still uses one entire cluster.</p>

<h3>The File Allocation Table</h3>

<p>The FAT itself is a simple array. Each entry corresponds to one cluster in
the data region. The value of each entry tells you:</p>

<ul>
  <li><strong>0x0000:</strong> Cluster is free.</li>
  <li><strong>0x0002&ndash;0xFFEF (FAT16) / 0x0FFFFFEF (FAT32):</strong>
      Next cluster in the chain (the file continues at this cluster).</li>
  <li><strong>0xFFF8&ndash;0xFFFF (FAT16) / 0x0FFFFFF8&ndash;0x0FFFFFFF
      (FAT32):</strong> End of chain (last cluster of the file).</li>
  <li><strong>0xFFF7 / 0x0FFFFFF7:</strong> Bad cluster.</li>
</ul>

<p>To read a file, you start at its <strong>first cluster</strong> (stored in
the directory entry), read that cluster from the data region, then look up the
FAT entry for that cluster to find the next cluster, and repeat until you hit
an end-of-chain marker. This is a <strong>singly-linked list</strong>
implemented as an array.</p>

<h3>Directory Entries</h3>

<p>Each directory entry is exactly <strong>32 bytes</strong>:</p>

<table>
  <tr><th>Offset</th><th>Size</th><th>Field</th></tr>
  <tr><td>0x00</td><td>8</td><td>Filename (space-padded)</td></tr>
  <tr><td>0x08</td><td>3</td><td>Extension (space-padded)</td></tr>
  <tr><td>0x0B</td><td>1</td><td>Attributes (read-only, hidden, system, volume, directory, archive)</td></tr>
  <tr><td>0x0E</td><td>2</td><td>Creation time</td></tr>
  <tr><td>0x10</td><td>2</td><td>Creation date</td></tr>
  <tr><td>0x14</td><td>2</td><td>First cluster high word (FAT32 only)</td></tr>
  <tr><td>0x16</td><td>2</td><td>Last write time</td></tr>
  <tr><td>0x18</td><td>2</td><td>Last write date</td></tr>
  <tr><td>0x1A</td><td>2</td><td>First cluster low word</td></tr>
  <tr><td>0x1C</td><td>4</td><td>File size in bytes</td></tr>
</table>

<p>An entry with a first byte of 0x00 means "no more entries." A first byte
of 0xE5 means "deleted entry." Subdirectories are just files with the
directory attribute set; their data clusters contain more 32-byte directory
entries.</p>

<h3>FAT16 vs. FAT32</h3>

<p><strong>FAT16:</strong> 16-bit FAT entries. Max ~65,525 clusters. Fixed
root directory area. Max volume size ~2 GB with 32 KB clusters.</p>

<p><strong>FAT32:</strong> 28-bit FAT entries (top 4 bits reserved). Max ~268
million clusters. Root directory is a regular cluster chain (no fixed area).
Max volume size ~2 TB.</p>

<p>The type is determined by the <em>number of clusters</em>, not by a format
flag: fewer than 4,085 clusters is FAT12, fewer than 65,525 is FAT16,
otherwise FAT32.</p>

<h3>Calculating the Data Region Start</h3>

<p>To locate the data region you need values from the BPB (BIOS Parameter
Block in sector 0):</p>

<pre><code>
root_dir_sectors = ((bpb.root_entry_count * 32) + (bpb.bytes_per_sector - 1))
                   / bpb.bytes_per_sector;

data_start = bpb.reserved_sectors
           + (bpb.num_fats * fat_size)
           + root_dir_sectors;
</code></pre>

<p>For FAT32, <code>root_dir_sectors</code> is 0 because the root directory
is stored as a regular cluster chain in the data region.</p>

<h3>Converting a Cluster Number to a Sector Number</h3>

<p>Clusters are numbered starting at 2 (clusters 0 and 1 are reserved).
To find the first sector of cluster <em>N</em>:</p>

<pre><code>
first_sector_of_cluster(N) = data_start + (N - 2) * bpb.sectors_per_cluster;
</code></pre>

<p>Read <code>bpb.sectors_per_cluster</code> consecutive sectors starting
from that position to get the entire cluster.</p>

<h3>Long Filename (LFN) Entries</h3>

<p>The standard 8.3 directory entry only stores filenames up to 8+3
characters. <strong>LFN entries</strong> (introduced in Windows 95)
store longer filenames in additional 32-byte entries placed immediately
before the standard entry. Each LFN entry holds up to 13 Unicode
characters and has its attribute byte set to <code>0x0F</code>
(a combination of read-only, hidden, system, and volume that older
systems ignore). When parsing a directory, check for attribute
<code>0x0F</code> to detect LFN entries.</p>
          `,
        },
        {
          type: "code",
          label: "FAT directory entry as a C struct (32 bytes)",
          code: `#include <stdint.h>

/* FAT directory entry -- exactly 32 bytes, packed */
typedef struct __attribute__((packed)) {
    char     name[8];           /* 0x00: Filename (space-padded)       */
    char     ext[3];            /* 0x08: Extension (space-padded)      */
    uint8_t  attr;              /* 0x0B: Attributes                    */
    uint8_t  nt_reserved;       /* 0x0C: Reserved for Windows NT      */
    uint8_t  create_time_tenth; /* 0x0D: Creation time (tenths of sec) */
    uint16_t create_time;       /* 0x0E: Creation time (HMS packed)    */
    uint16_t create_date;       /* 0x10: Creation date (YMD packed)    */
    uint16_t access_date;       /* 0x12: Last access date              */
    uint16_t cluster_hi;        /* 0x14: First cluster high word (FAT32) */
    uint16_t write_time;        /* 0x16: Last write time               */
    uint16_t write_date;        /* 0x18: Last write date               */
    uint16_t cluster_lo;        /* 0x1A: First cluster low word        */
    uint32_t file_size;         /* 0x1C: File size in bytes            */
} fat_dirent_t;

/* Attribute bit masks */
#define ATTR_READ_ONLY  0x01
#define ATTR_HIDDEN     0x02
#define ATTR_SYSTEM     0x04
#define ATTR_VOLUME_ID  0x08
#define ATTR_DIRECTORY  0x10
#define ATTR_ARCHIVE    0x20
#define ATTR_LFN        0x0F  /* LFN entry (combination of RO+HID+SYS+VOL) */

/* Get the full 32-bit first cluster number */
static inline uint32_t dirent_first_cluster(const fat_dirent_t *d) {
    return ((uint32_t)d->cluster_hi << 16) | d->cluster_lo;
}`,
        },
        {
          type: "video",
          id: "V2Gxqv3bJCk",
          title: "Ben Eater -- How Does a USB Flash Drive Work? (FAT Filesystem)",
        },
        {
          type: "resources",
          links: [
            {
              type: "Wiki",
              title: "OSDev Wiki -- FAT",
              url: "https://wiki.osdev.org/FAT",
              desc: "The essential reference for implementing FAT in an OS.",
            },
            {
              type: "Tutorial",
              title: "Phobos -- A Tutorial on the FAT File System",
              url: "https://www.tavi.co.uk/phobos/fat.html",
              desc: "Clear, concise FAT16/FAT32 tutorial.",
            },
            {
              type: "Reference",
              title: "elm-chan -- FAT Filesystem Specification",
              url: "https://elm-chan.org/docs/fat_e.html",
              desc: "Detailed specification with diagrams from the author of FatFs.",
            },
            {
              type: "Article",
              title: "Wikipedia -- Design of the FAT File System",
              url: "https://en.wikipedia.org/wiki/Design_of_the_FAT_file_system",
              desc: "Comprehensive reference on all FAT variants.",
            },
            {
              type: "Lecture",
              title: "UMass CS365 -- FATs and Directory Entries",
              url: "https://people.cs.umass.edu/~brian/2023-fall-cs365/lecture-notes/08-fats-and-directory-entries/",
              desc: "University lecture with worked examples.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- FAT Filesystem",
          items: [
            "<strong>Parse the BPB:</strong> Create a FAT16 disk image using <code>mkfs.fat -F 16 disk.img</code>. Write a C program that reads sector 0 and parses/prints every field of the BIOS Parameter Block.",
            "<strong>Read the FAT:</strong> Extend your program to read the FAT and print the cluster chain for each file. Format: 'File: HELLO.TXT -> cluster 2 -> cluster 3 -> cluster 7 -> END'.",
            "<strong>List root directory:</strong> Write a function that reads the root directory entries and prints each file's name, size, attributes, and first cluster. Handle deleted entries (0xE5) and end-of-directory (0x00) correctly.",
            "<strong>Read a file:</strong> Implement <code>fat_read_file(const char *filename, uint8_t *buffer)</code> that follows the cluster chain to read an entire file into memory. Test by writing a text file to the disk image on your host OS and reading it back with your code.",
            "<strong>Write a file:</strong> Implement <code>fat_write_file(const char *filename, const uint8_t *data, uint32_t size)</code> that finds free clusters, writes the data, updates the FAT, and creates a directory entry.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 12: Writing a Shell
    // -------------------------------------------------------------------------
    {
      id: 12,
      title: "Writing a Shell from Scratch",
      subtitle: "A command-line interpreter using fork, exec, and wait",
      duration: "75 min",
      content: [
        {
          type: "text",
          html: `
<h2>What a Shell Does</h2>

<p>A <strong>shell</strong> is a program that reads commands from the user,
parses them, and executes them. It is the primary interface between a human
and the operating system kernel. Internally, a shell is a loop:</p>

<pre><code>
while (true) {
    print_prompt();
    line = read_line();
    args = parse_line(line);
    execute(args);
}
</code></pre>

<h3>Step 1: Read a Line</h3>

<p>Read characters from stdin until a newline. Store them in a dynamically-
sized buffer (use <code>getline()</code> or implement your own with
<code>read()</code> and <code>realloc()</code>).</p>

<h3>Step 2: Parse (Tokenize)</h3>

<p>Split the line into tokens separated by whitespace. The first token is the
command, the rest are arguments. Use <code>strtok()</code> or write your own
tokenizer. Handle edge cases: empty lines, lines with only whitespace.</p>

<h3>Step 3: Execute</h3>

<p>There are two kinds of commands:</p>

<ul>
  <li><strong>Built-in commands</strong> (implemented inside the shell
      itself): <code>cd</code>, <code>exit</code>, <code>help</code>,
      <code>export</code>. These cannot be external programs because they
      need to modify the shell's own state (e.g., <code>cd</code> changes
      the shell's working directory).</li>
  <li><strong>External commands</strong>: Everything else. The shell forks a
      child, the child calls <code>execvp()</code> to run the program, and
      the parent calls <code>waitpid()</code> to wait for it.</li>
</ul>

<h3>Step 4: I/O Redirection (Bonus)</h3>

<p>To implement <code>command > file</code>:</p>
<ol>
  <li>Fork.</li>
  <li>In the child, before exec: <code>close(STDOUT_FILENO)</code>, then
      <code>open("file", O_WRONLY | O_CREAT | O_TRUNC, 0644)</code>. The
      open returns fd 1 (the lowest available fd), so stdout now points
      to the file.</li>
  <li>Exec the command. It writes to stdout, which goes to the file.</li>
</ol>

<h3>Step 5: Pipes (Bonus)</h3>

<p>To implement <code>cmd1 | cmd2</code>:</p>
<ol>
  <li>Create a pipe: <code>pipe(pipefd)</code>.</li>
  <li>Fork twice (one child for cmd1, one for cmd2).</li>
  <li>cmd1's child: redirect stdout to <code>pipefd[1]</code>, close both
      pipe fds, exec cmd1.</li>
  <li>cmd2's child: redirect stdin to <code>pipefd[0]</code>, close both
      pipe fds, exec cmd2.</li>
  <li>Parent: close both pipe fds, wait for both children.</li>
</ol>
          `,
        },
        {
          type: "code",
          label: "Minimal shell in C (core loop)",
          code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

#define MAX_ARGS 64

char *read_line(void) {
    char *line = NULL;
    size_t len = 0;
    if (getline(&line, &len, stdin) == -1) {
        free(line);
        return NULL;  // EOF
    }
    return line;
}

int parse_line(char *line, char **args) {
    int argc = 0;
    char *tok = strtok(line, " \\t\\n");
    while (tok && argc < MAX_ARGS - 1) {
        args[argc++] = tok;
        tok = strtok(NULL, " \\t\\n");
    }
    args[argc] = NULL;
    return argc;
}

int execute(char **args) {
    if (args[0] == NULL) return 1;

    // Built-in: cd
    if (strcmp(args[0], "cd") == 0) {
        if (args[1] == NULL) fprintf(stderr, "cd: missing argument\\n");
        else if (chdir(args[1]) != 0) perror("cd");
        return 1;
    }
    // Built-in: exit
    if (strcmp(args[0], "exit") == 0) return 0;

    // External command
    pid_t pid = fork();
    if (pid == 0) {
        execvp(args[0], args);
        perror(args[0]);
        _exit(127);
    }
    int status;
    waitpid(pid, &status, 0);
    return 1;
}

int main(void) {
    char *line;
    char *args[MAX_ARGS];
    int running = 1;

    while (running) {
        printf("mysh> ");
        line = read_line();
        if (!line) break;
        parse_line(line, args);
        running = execute(args);
        free(line);
    }
    return 0;
}`,
        },
        {
          type: "video",
          id: "cIBmeEpsMj0",
          title: "CodeVault -- Making Your Own Shell in C",
        },
        {
          type: "resources",
          links: [
            {
              type: "Tutorial",
              title: "Stephen Brennan -- Write a Shell in C",
              url: "https://brennan.io/2015/01/16/write-a-shell-in-c/",
              desc: "The classic tutorial on building a Unix shell from scratch.",
            },
            {
              type: "Code",
              title: "GitHub: brenns10/lsh",
              url: "https://github.com/brenns10/lsh",
              desc: "Source code for the tutorial above.",
            },
            {
              type: "Textbook (free)",
              title: "Purdue -- Writing Your Own Shell (Chapter 5)",
              url: "https://www.cs.purdue.edu/homes/grr/SystemsProgrammingBook/Book/Chapter5-WritingYourOwnShell.pdf",
              desc: "Comprehensive chapter from a systems programming textbook.",
            },
            {
              type: "Article",
              title: "GeeksforGeeks -- Making Your Own Linux Shell in C",
              url: "https://www.geeksforgeeks.org/making-linux-shell-c/",
              desc: "Tutorial with piping and I/O redirection.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Shell",
          items: [
            "<strong>Basic shell:</strong> Implement the minimal shell from the code above. Test it with commands like <code>ls -la</code>, <code>pwd</code>, <code>cd /tmp</code>, <code>echo hello</code>, and <code>exit</code>.",
            "<strong>Output redirection:</strong> Add support for <code>command > file</code> and <code>command >> file</code> (append). Test: <code>ls > out.txt</code> then <code>cat out.txt</code>.",
            "<strong>Input redirection:</strong> Add support for <code>command < file</code>. Test: <code>wc -l < out.txt</code>.",
            "<strong>Pipes:</strong> Add support for a single pipe: <code>cmd1 | cmd2</code>. Test: <code>ls -la | wc -l</code> and <code>cat /etc/passwd | grep root</code>.",
            "<strong>Background processes:</strong> Add support for <code>command &</code>. The shell should not wait for the child and should print its PID. Handle SIGCHLD to reap finished background processes.",
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // LESSON 13: Unix Utilities Implementation
    // -------------------------------------------------------------------------
    {
      id: 13,
      title: "Unix Utilities: cat, ls, rm, echo",
      subtitle: "Implementing core command-line tools from scratch",
      duration: "60 min",
      content: [
        {
          type: "text",
          html: `
<h2>Why Build Unix Utilities?</h2>

<p>Building your own versions of standard Unix utilities teaches you:</p>
<ul>
  <li>How system calls (open, read, write, close, stat, readdir, unlink)
      actually work.</li>
  <li>How to handle errors properly and print useful diagnostics.</li>
  <li>How real programs parse command-line arguments.</li>
  <li>The "Unix philosophy": each tool does one thing well, reads from
      stdin or files, writes to stdout, and can be composed with pipes.</li>
</ul>

<h3>echo -- Print arguments to stdout</h3>

<p><code>echo</code> is the simplest Unix utility. It prints its arguments
separated by spaces, followed by a newline.</p>

<pre><code>// my_echo.c
#include &lt;stdio.h&gt;
int main(int argc, char *argv[]) {
    for (int i = 1; i &lt; argc; i++) {
        if (i > 1) putchar(' ');
        fputs(argv[i], stdout);
    }
    putchar('\\n');
    return 0;
}
</code></pre>

<h3>cat -- Concatenate and print files</h3>

<p><code>cat</code> reads one or more files (or stdin if no files given) and
writes their contents to stdout. The core logic is a simple read-write
loop.</p>

<pre><code>// Simplified cat core logic
void cat_fd(int fd) {
    char buf[4096];
    ssize_t n;
    while ((n = read(fd, buf, sizeof(buf))) > 0) {
        write(STDOUT_FILENO, buf, n);
    }
}
</code></pre>

<h3>ls -- List directory contents</h3>

<p><code>ls</code> uses <code>opendir()</code> and <code>readdir()</code> to
iterate over directory entries. For <code>ls -l</code>, it also calls
<code>stat()</code> on each entry to get file size, permissions, modification
time, etc.</p>

<p>Key system calls and functions:</p>
<ul>
  <li><code>opendir(path)</code> &mdash; Open a directory for reading.</li>
  <li><code>readdir(dir)</code> &mdash; Read the next directory entry (returns
      a <code>struct dirent</code> with <code>d_name</code>).</li>
  <li><code>stat(path, &sb)</code> &mdash; Get file metadata (size, mode,
      mtime, uid, gid).</li>
  <li><code>closedir(dir)</code> &mdash; Close the directory.</li>
</ul>

<h3>rm -- Remove files</h3>

<p><code>rm</code> calls <code>unlink(path)</code> for each file argument.
<code>unlink</code> removes the directory entry and decrements the link
count. When the link count reaches zero and no process has the file open,
the kernel frees the inode and data blocks.</p>

<p>For <code>rm -r</code> (recursive), you need to walk directories with
<code>opendir</code>/<code>readdir</code>, remove files with
<code>unlink</code>, and remove empty directories with <code>rmdir</code>.</p>

<h3>Argument Parsing</h3>

<p>Real Unix utilities use <code>getopt()</code> to parse flags like
<code>-l</code>, <code>-a</code>, <code>-r</code>. A simplified approach
for learning: loop over argv and check if each argument starts with '-'.</p>

<h3>Key Fields of struct stat</h3>

<p>When you call <code>stat(path, &amp;sb)</code>, the kernel fills a
<code>struct stat</code> with metadata about the file. The most important
fields:</p>

<ul>
  <li><code>st_mode</code> &mdash; File type and permissions. Use macros
      <code>S_ISREG()</code>, <code>S_ISDIR()</code>,
      <code>S_ISLNK()</code> to test the type. Permission bits can be
      extracted with <code>st_mode &amp; 0777</code>.</li>
  <li><code>st_size</code> &mdash; File size in bytes (type
      <code>off_t</code>).</li>
  <li><code>st_mtime</code> &mdash; Last modification time as a
      <code>time_t</code> (seconds since Unix epoch). Pass to
      <code>localtime()</code> and <code>strftime()</code> for
      human-readable output.</li>
  <li><code>st_nlink</code> &mdash; Number of hard links.</li>
  <li><code>st_uid</code> / <code>st_gid</code> &mdash; Owner and group
      IDs.</li>
</ul>
          `,
        },
        {
          type: "code",
          label: "Complete cat implementation with stdin fallback",
          code: `/* my_cat.c -- concatenate files to stdout */
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

#define BUF_SIZE 4096

/* Copy all bytes from fd to stdout */
static int cat_fd(int fd) {
    char buf[BUF_SIZE];
    ssize_t n;
    while ((n = read(fd, buf, sizeof(buf))) > 0) {
        ssize_t written = 0;
        while (written < n) {
            ssize_t w = write(STDOUT_FILENO, buf + written, n - written);
            if (w < 0) { perror("write"); return 1; }
            written += w;
        }
    }
    if (n < 0) { perror("read"); return 1; }
    return 0;
}

int main(int argc, char *argv[]) {
    int ret = 0;

    /* No arguments: read from stdin */
    if (argc < 2) {
        return cat_fd(STDIN_FILENO);
    }

    /* Process each file argument */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-") == 0) {
            ret |= cat_fd(STDIN_FILENO);
            continue;
        }
        int fd = open(argv[i], O_RDONLY);
        if (fd < 0) {
            perror(argv[i]);
            ret = 1;
            continue;
        }
        ret |= cat_fd(fd);
        close(fd);
    }
    return ret;
}`,
        },
        {
          type: "code",
          label: "Minimal ls using opendir/readdir/stat",
          code: `/* my_ls.c -- list directory contents with optional -a and -l flags */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

static int show_all = 0;   /* -a flag */
static int long_fmt = 0;   /* -l flag */

static void print_mode(mode_t m) {
    putchar(S_ISDIR(m) ? 'd' : S_ISLNK(m) ? 'l' : '-');
    putchar(m & S_IRUSR ? 'r' : '-');
    putchar(m & S_IWUSR ? 'w' : '-');
    putchar(m & S_IXUSR ? 'x' : '-');
    putchar(m & S_IRGRP ? 'r' : '-');
    putchar(m & S_IWGRP ? 'w' : '-');
    putchar(m & S_IXGRP ? 'x' : '-');
    putchar(m & S_IROTH ? 'r' : '-');
    putchar(m & S_IWOTH ? 'w' : '-');
    putchar(m & S_IXOTH ? 'x' : '-');
}

static int list_dir(const char *path) {
    DIR *d = opendir(path);
    if (!d) { perror(path); return 1; }

    struct dirent *ent;
    while ((ent = readdir(d)) != NULL) {
        /* Skip hidden files unless -a */
        if (!show_all && ent->d_name[0] == '.') continue;

        if (long_fmt) {
            /* Build full path for stat() */
            char fullpath[1024];
            snprintf(fullpath, sizeof(fullpath), "%s/%s", path, ent->d_name);
            struct stat sb;
            if (stat(fullpath, &sb) < 0) { perror(fullpath); continue; }

            print_mode(sb.st_mode);
            char timebuf[64];
            strftime(timebuf, sizeof(timebuf), "%b %d %H:%M",
                     localtime(&sb.st_mtime));
            printf(" %3ld %8lld %s %s\\n",
                   (long)sb.st_nlink, (long long)sb.st_size,
                   timebuf, ent->d_name);
        } else {
            printf("%s\\n", ent->d_name);
        }
    }
    closedir(d);
    return 0;
}

int main(int argc, char *argv[]) {
    int opt_end = 1;
    /* Simple flag parsing */
    for (int i = 1; i < argc && argv[i][0] == '-'; i++, opt_end++) {
        for (const char *p = argv[i] + 1; *p; p++) {
            if (*p == 'a') show_all = 1;
            else if (*p == 'l') long_fmt = 1;
        }
    }
    if (opt_end >= argc)
        return list_dir(".");
    for (int i = opt_end; i < argc; i++)
        list_dir(argv[i]);
    return 0;
}`,
        },
        {
          type: "code",
          label: "getopt() usage example",
          code: `/* getopt_example.c -- standard flag parsing for Unix utilities */
#include <stdio.h>
#include <unistd.h>   /* getopt(), optarg, optind */

int main(int argc, char *argv[]) {
    int aflag = 0, lflag = 0, nflag = 0;
    char *outfile = NULL;
    int opt;

    /* "aln" = flags without arguments
     * "o:" = -o requires an argument (the colon)  */
    while ((opt = getopt(argc, argv, "alno:")) != -1) {
        switch (opt) {
        case 'a': aflag = 1; break;
        case 'l': lflag = 1; break;
        case 'n': nflag = 1; break;
        case 'o': outfile = optarg; break;
        default:
            fprintf(stderr, "Usage: %s [-aln] [-o outfile] [file...]\\n",
                    argv[0]);
            return 1;
        }
    }

    /* After getopt, argv[optind] .. argv[argc-1] are non-option args */
    printf("Flags: a=%d l=%d n=%d outfile=%s\\n",
           aflag, lflag, nflag, outfile ? outfile : "(none)");
    for (int i = optind; i < argc; i++)
        printf("Arg: %s\\n", argv[i]);

    return 0;
}
/* Example: ./a.out -al -o result.txt foo.c bar.c
 * Flags: a=1 l=1 n=0 outfile=result.txt
 * Arg: foo.c
 * Arg: bar.c
 */`,
        },
        {
          type: "video",
          id: "vR6pCgPpEnA",
          title: "CS50 -- Unix / Linux: The Basics and cat, ls, grep",
        },
        {
          type: "resources",
          links: [
            {
              type: "Article",
              title: "GeeksforGeeks -- Build Your Own cat in C",
              url: "https://www.geeksforgeeks.org/build-your-own-cat-command-in-c-for-linux/",
              desc: "Step-by-step implementation of cat in C.",
            },
            {
              type: "Tutorial",
              title: "Medium -- Unix Commands: Let's Build Cat",
              url: "https://austinedger.medium.com/unix-commands-lets-build-cat-59b8a91b9708",
              desc: "Building cat from scratch with explanations.",
            },
            {
              type: "Course",
              title: "MIT xv6 -- User-space utilities lab",
              url: "https://pdos.csail.mit.edu/6.828/2023/xv6.html",
              desc: "xv6 lab where you implement Unix utilities from scratch.",
            },
            {
              type: "Code",
              title: "GNU Coreutils source code",
              url: "https://github.com/coreutils/coreutils",
              desc: "The production implementations of cat, ls, rm, echo, and more.",
            },
          ],
        },
        {
          type: "practice",
          title: "Practice Exercises -- Unix Utilities",
          items: [
            "<strong>my_echo:</strong> Implement echo that handles the <code>-n</code> flag (suppress trailing newline). Test: <code>./my_echo -n hello world</code> should output 'hello world' without a newline.",
            "<strong>my_cat:</strong> Implement cat that reads from stdin when no files are given and handles multiple files. Add a <code>-n</code> flag that numbers output lines. Use only system calls (open/read/write/close), not stdio.",
            "<strong>my_ls:</strong> Implement ls that lists the current directory by default or a specified directory. Add <code>-a</code> (show hidden files) and <code>-l</code> (long format showing permissions, size, and mtime). Use opendir/readdir/stat.",
            "<strong>my_rm:</strong> Implement rm with <code>-i</code> (prompt before removal) and <code>-r</code> (recursive). Make sure <code>rm -r</code> handles directories containing files and subdirectories.",
            "<strong>my_wc:</strong> (Bonus) Implement wc (word count) that counts lines, words, and characters. Support multiple files and stdin.",
          ],
        },
      ],
    },
  ],
}

// Named export used by courseData.js
