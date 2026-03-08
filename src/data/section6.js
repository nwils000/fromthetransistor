export const section6 = {
  id: 6,
  title: "Browser: Coming Online",
  subtitle: "TCP/IP, HTTP, and a Web Browser",
  duration: "1 week",
  description: "Build a minimal TCP/IP stack, implement HTTP, and create a text-based web browser from scratch — connecting every layer from raw packets to rendered HTML.",
  longDescription: "This is the capstone section where everything comes together. You'll implement a TCP/IP networking stack in C, build a telnet server to prove it works, understand dynamic linking so your programs can share libraries, implement the HTTP protocol, and finally build a text-based web browser that can fetch and render web pages. By the end, you'll have connected every layer of the computing stack — from transistors to a working browser.",
  topics: ["TCP/IP", "HTTP", "HTML Parsing", "Telnet", "Dynamic Linking", "Web Browser"],
  learningGoals: [
    "Understand the TCP/IP protocol stack from first principles",
    "Implement IP packet construction, parsing, and basic routing",
    "Build a working TCP state machine with 3-way handshake and reliable delivery",
    "Create a multi-user telnet server using fork and sockets",
    "Understand dynamic linking: GOT, PLT, and the runtime linker",
    "Parse and construct HTTP requests and responses",
    "Build a text-based web browser that fetches and renders HTML",
  ],
  lessons: [
    {
      id: 1,
      title: "TCP/IP Stack from Scratch",
      subtitle: "Building the Internet's foundation in C",
      duration: "4 hours",
      content: [
        { type: 'text', html: `
<h2>The Internet Protocol Suite: First Principles</h2>
<p>Every time you load a web page, send an email, or stream a video, your data travels through a <strong>layered protocol stack</strong>. Each layer has one job, and it does that job without caring about the layers above or below it. This separation of concerns is what makes the Internet work.</p>

<p>We're going to build this stack from the bottom up, in C, understanding every byte.</p>

<h3>The Four Layers</h3>
<p>The TCP/IP model has four layers. Data flows down the stack on the sending side (each layer wraps the data in its own header) and back up on the receiving side (each layer strips its header):</p>
` },
        { type: 'diagram', content: `
The TCP/IP Protocol Stack
=========================

  APPLICATION LAYER        "I want to GET /index.html"
  (HTTP, Telnet, DNS)       |
                            v
  TRANSPORT LAYER          Adds TCP header (ports, sequence numbers, flags)
  (TCP, UDP)                |
                            v
  NETWORK LAYER            Adds IP header (source/destination IP addresses)
  (IP, ICMP)                |
                            v
  LINK LAYER               Adds Ethernet header (MAC addresses) + trailer
  (Ethernet, ARP)           |
                            v
                       Physical wire / radio

Data Encapsulation (sending):
+----------------------------------------------------------+
| Ethernet | IP Header | TCP Header | HTTP Request Data    |
| Header   | (20 bytes)| (20 bytes) | "GET /index.html..." |
| (14 bytes)|          |            |                      |
+----------------------------------------------------------+
|<---------- Ethernet Frame (up to 1518 bytes) ----------->|

Each layer only looks at its own header — this is the
power of layered protocol design.` },
        { type: 'text', html: `
<h3>The IP Protocol (Internet Protocol)</h3>
<p>IP is the <strong>network layer</strong> — it handles addressing and routing. Every device on the Internet has an IP address, and IP's job is to get a packet from source address to destination address, hopping through routers as needed.</p>

<p>IP is <strong>connectionless</strong> and <strong>unreliable</strong> — it makes no guarantees about delivery, ordering, or duplicates. That's TCP's job. IP just does its best to deliver each packet independently.</p>

<h4>The IPv4 Header</h4>
<p>Every IP packet starts with a 20-byte header (minimum). Let's examine every field:</p>
` },
        { type: 'diagram', content: `
IPv4 Header (20 bytes minimum)
================================
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |    DSCP   |ECN|         Total Length          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|    Fragment Offset      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |   Protocol    |        Header Checksum        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Source IP Address                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   Destination IP Address                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

Key fields:
  Version  = 4 (for IPv4)
  IHL      = Header length in 32-bit words (usually 5 = 20 bytes)
  TTL      = Hop counter, decremented by each router. Packet dies at 0.
  Protocol = What's inside: 6 = TCP, 17 = UDP, 1 = ICMP
  Checksum = One's complement sum of header (NOT payload)` },
        { type: 'code', label: 'ip.h — IPv4 header structure in C', code: `#include <stdint.h>

/* IPv4 header — 20 bytes (no options) */
struct ip_header {
    uint8_t  version_ihl;    /* version (4 bits) + IHL (4 bits)       */
    uint8_t  dscp_ecn;       /* DSCP (6 bits) + ECN (2 bits)          */
    uint16_t total_length;   /* entire packet size in bytes            */
    uint16_t identification; /* fragment identification                */
    uint16_t flags_fragoff;  /* flags (3 bits) + fragment offset (13)  */
    uint8_t  ttl;            /* time to live (hop limit)               */
    uint8_t  protocol;       /* upper-layer protocol (6=TCP, 17=UDP)  */
    uint16_t checksum;       /* header checksum                       */
    uint32_t src_addr;       /* source IP address                     */
    uint32_t dst_addr;       /* destination IP address                */
} __attribute__((packed));

#define IP_PROTO_ICMP  1
#define IP_PROTO_TCP   6
#define IP_PROTO_UDP   17

/* Helper: compute IP checksum (one's complement of one's complement sum) */
uint16_t ip_checksum(const void *data, int length) {
    const uint16_t *words = (const uint16_t *)data;
    uint32_t sum = 0;

    while (length > 1) {
        sum += *words++;
        length -= 2;
    }
    /* Handle odd byte */
    if (length == 1) {
        sum += *(const uint8_t *)words;
    }
    /* Fold 32-bit sum into 16 bits */
    while (sum >> 16) {
        sum = (sum & 0xFFFF) + (sum >> 16);
    }
    return (uint16_t)(~sum);
}

/* Build an IP header. Caller fills in the payload after this header. */
void ip_build_header(struct ip_header *hdr,
                     uint32_t src, uint32_t dst,
                     uint8_t protocol, uint16_t payload_len)
{
    hdr->version_ihl   = 0x45;  /* IPv4, 5 x 32-bit words = 20 bytes */
    hdr->dscp_ecn      = 0;
    hdr->total_length   = htons(20 + payload_len);
    hdr->identification = htons(0);
    hdr->flags_fragoff  = htons(0x4000); /* Don't Fragment flag set */
    hdr->ttl            = 64;
    hdr->protocol       = protocol;
    hdr->checksum       = 0;
    hdr->src_addr       = htonl(src);
    hdr->dst_addr       = htonl(dst);
    /* Compute checksum over the header with checksum field = 0 */
    hdr->checksum       = ip_checksum(hdr, 20);
}` },
        { type: 'info', variant: 'info', title: 'Network Byte Order (Big-Endian)',
          html: `<p>Network protocols use <strong>big-endian</strong> byte order (most significant byte first), also called "network byte order." Your CPU might be little-endian (x86, ARM in default mode), so you must convert multi-byte values using <code>htons()</code> (host-to-network short), <code>htonl()</code> (host-to-network long), and their inverses <code>ntohs()</code> / <code>ntohl()</code>. Forgetting this is a classic networking bug — your 16-bit port number 80 (0x0050) becomes 20480 (0x5000) if you don't convert.</p>` },
        { type: 'text', html: `
<h3>ARP: Resolving IP Addresses to MAC Addresses</h3>
<p>IP knows the destination IP address, but Ethernet frames need a <strong>MAC address</strong> (48-bit hardware address burned into the network card). ARP (Address Resolution Protocol) bridges this gap.</p>

<p>ARP works by broadcasting a question: "Who has IP 192.168.1.1? Tell 192.168.1.50." The machine with that IP replies with its MAC address. Results are cached in an ARP table.</p>
` },
        { type: 'code', label: 'arp.h — ARP packet structure', code: `/* ARP packet for IPv4 over Ethernet */
struct arp_packet {
    uint16_t hw_type;        /* 1 = Ethernet                        */
    uint16_t proto_type;     /* 0x0800 = IPv4                       */
    uint8_t  hw_len;         /* 6 (MAC address length)              */
    uint8_t  proto_len;      /* 4 (IPv4 address length)             */
    uint16_t operation;      /* 1 = request, 2 = reply              */
    uint8_t  sender_mac[6];  /* sender hardware address             */
    uint32_t sender_ip;      /* sender protocol address             */
    uint8_t  target_mac[6];  /* target hardware address (0 in req)  */
    uint32_t target_ip;      /* target protocol address             */
} __attribute__((packed));

#define ARP_REQUEST  1
#define ARP_REPLY    2

/* Simple ARP cache — just a flat array for our minimal stack */
#define ARP_CACHE_SIZE 32

struct arp_entry {
    uint32_t ip;
    uint8_t  mac[6];
    int      valid;
};

static struct arp_entry arp_cache[ARP_CACHE_SIZE];

/* Look up MAC for a given IP. Returns pointer or NULL. */
uint8_t *arp_lookup(uint32_t ip) {
    for (int i = 0; i < ARP_CACHE_SIZE; i++) {
        if (arp_cache[i].valid && arp_cache[i].ip == ip)
            return arp_cache[i].mac;
    }
    return NULL;  /* Must send ARP request */
}` },
        { type: 'text', html: `
<h3>TCP: The Transmission Control Protocol</h3>
<p>TCP provides what IP doesn't: <strong>reliable, ordered, connection-oriented</strong> byte streams. It's the workhorse of the Internet — HTTP, SSH, SMTP, and most application protocols run on top of TCP.</p>

<p>TCP achieves reliability through several mechanisms working together:</p>
<ul>
<li><strong>Sequence numbers:</strong> Every byte is numbered, so the receiver can detect missing or reordered data</li>
<li><strong>Acknowledgments (ACKs):</strong> The receiver tells the sender what it has received</li>
<li><strong>Retransmission:</strong> If an ACK doesn't arrive in time, the sender resends</li>
<li><strong>Flow control:</strong> The receiver advertises how much buffer space it has (window size)</li>
<li><strong>Connection setup/teardown:</strong> Explicit handshakes to establish and close connections</li>
</ul>

<h4>TCP Header</h4>
` },
        { type: 'diagram', content: `
TCP Header (20 bytes minimum)
===============================
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Acknowledgment Number                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Data  |Reserv|C|E|U|A|P|R|S|F|                               |
|Offset |      |W|C|R|C|S|S|Y|I|          Window Size           |
|       |      |R|E|G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |        Urgent Pointer         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

Key flags (the six critical ones):
  SYN = Synchronize sequence numbers (connection setup)
  ACK = Acknowledgment field is valid
  FIN = Sender is finished sending (connection teardown)
  RST = Reset the connection (abort)
  PSH = Push data to application immediately
  URG = Urgent data pointer is valid` },
        { type: 'code', label: 'tcp.h — TCP header and connection state', code: `#include <stdint.h>

struct tcp_header {
    uint16_t src_port;
    uint16_t dst_port;
    uint32_t seq_num;        /* sequence number of first data byte    */
    uint32_t ack_num;        /* next sequence number sender expects   */
    uint8_t  data_offset;    /* header length in 32-bit words (>> 4)  */
    uint8_t  flags;          /* TCP flags                             */
    uint16_t window;         /* receive window size                   */
    uint16_t checksum;       /* TCP checksum (includes pseudo-header) */
    uint16_t urgent_ptr;     /* urgent data pointer                   */
} __attribute__((packed));

/* TCP flag bits */
#define TCP_FIN  0x01
#define TCP_SYN  0x02
#define TCP_RST  0x04
#define TCP_PSH  0x08
#define TCP_ACK  0x10
#define TCP_URG  0x20

/* TCP connection states (RFC 793) */
enum tcp_state {
    TCP_CLOSED,
    TCP_LISTEN,
    TCP_SYN_SENT,
    TCP_SYN_RECEIVED,
    TCP_ESTABLISHED,
    TCP_FIN_WAIT_1,
    TCP_FIN_WAIT_2,
    TCP_CLOSE_WAIT,
    TCP_CLOSING,
    TCP_LAST_ACK,
    TCP_TIME_WAIT,
};

/* A TCP connection (Transmission Control Block) */
struct tcp_connection {
    enum tcp_state state;

    /* Local and remote endpoints */
    uint32_t local_ip;
    uint16_t local_port;
    uint32_t remote_ip;
    uint16_t remote_port;

    /* Sequence number tracking */
    uint32_t snd_una;   /* oldest unacknowledged seq number       */
    uint32_t snd_nxt;   /* next seq number to send                */
    uint32_t snd_wnd;   /* send window (how much remote can take) */
    uint32_t rcv_nxt;   /* next seq number we expect to receive   */
    uint32_t rcv_wnd;   /* our receive window                     */

    /* Receive buffer */
    uint8_t  rcv_buf[65535];
    uint16_t rcv_buf_len;

    /* Send buffer */
    uint8_t  snd_buf[65535];
    uint16_t snd_buf_len;
};` },
        { type: 'text', html: `
<h4>The Three-Way Handshake</h4>
<p>Before any data can flow, TCP establishes a connection using a three-message handshake. This synchronizes sequence numbers on both sides:</p>
` },
        { type: 'diagram', content: `
TCP Three-Way Handshake
========================

  Client                                    Server
    |                                          |
    |  1. SYN  (seq=100)                       |
    |----------------------------------------->|  "I want to connect.
    |                                          |   My starting seq is 100."
    |                                          |
    |  2. SYN+ACK  (seq=300, ack=101)          |
    |<-----------------------------------------|  "OK. My starting seq is 300.
    |                                          |   I acknowledge your 100
    |                                          |   (expecting 101 next)."
    |                                          |
    |  3. ACK  (seq=101, ack=301)              |
    |----------------------------------------->|  "Got it. I acknowledge your 300
    |                                          |   (expecting 301 next)."
    |                                          |
    |          CONNECTION ESTABLISHED           |
    |                                          |

Why three messages?
- Both sides need to pick a random Initial Sequence Number (ISN)
- Both sides need to confirm they received the other's ISN
- This requires a minimum of 3 messages (SYN, SYN+ACK, ACK)

Why random ISNs?
- Security: prevents sequence number prediction attacks
- Avoids confusion with old packets from previous connections` },
        { type: 'code', label: 'tcp_handshake.c — Implementing the handshake', code: `#include "tcp.h"
#include "ip.h"
#include <stdlib.h>
#include <string.h>
#include <time.h>

/* Generate a random initial sequence number */
static uint32_t tcp_generate_isn(void) {
    /* In production, use a secure PRNG. For learning, this suffices. */
    return (uint32_t)rand() ^ (uint32_t)time(NULL);
}

/* Build and send a TCP segment */
static void tcp_send_segment(struct tcp_connection *conn,
                             uint8_t flags,
                             const uint8_t *data, uint16_t data_len)
{
    uint8_t packet[1500];
    struct ip_header  *ip  = (struct ip_header *)packet;
    struct tcp_header *tcp = (struct tcp_header *)(packet + 20);

    /* Fill TCP header */
    tcp->src_port    = htons(conn->local_port);
    tcp->dst_port    = htons(conn->remote_port);
    tcp->seq_num     = htonl(conn->snd_nxt);
    tcp->ack_num     = htonl(conn->rcv_nxt);
    tcp->data_offset = 0x50;          /* 5 x 32-bit words = 20 bytes */
    tcp->flags       = flags;
    tcp->window      = htons(conn->rcv_wnd);
    tcp->checksum    = 0;
    tcp->urgent_ptr  = 0;

    /* Copy payload after TCP header */
    if (data && data_len > 0) {
        memcpy(packet + 40, data, data_len);
    }

    /* Compute TCP checksum using the pseudo-header */
    tcp->checksum = tcp_checksum(ip, tcp, data, data_len);

    /* Build IP header wrapping the TCP segment */
    ip_build_header(ip, conn->local_ip, conn->remote_ip,
                    IP_PROTO_TCP, 20 + data_len);

    /* Advance sequence number */
    if (flags & (TCP_SYN | TCP_FIN))
        conn->snd_nxt += 1;       /* SYN and FIN consume one seq number */
    conn->snd_nxt += data_len;

    /* Send the packet out (platform-specific) */
    net_send_packet(packet, 40 + data_len);
}

/* Client: initiate a connection (active open) */
void tcp_connect(struct tcp_connection *conn,
                 uint32_t remote_ip, uint16_t remote_port)
{
    conn->state       = TCP_SYN_SENT;
    conn->remote_ip   = remote_ip;
    conn->remote_port = remote_port;
    conn->snd_nxt     = tcp_generate_isn();
    conn->snd_una     = conn->snd_nxt;
    conn->rcv_wnd     = 65535;

    /* Step 1: Send SYN */
    tcp_send_segment(conn, TCP_SYN, NULL, 0);
}

/* Handle an incoming TCP segment (called by IP layer) */
void tcp_input(struct tcp_connection *conn,
               struct tcp_header *tcp, uint16_t seg_len)
{
    uint32_t seg_seq = ntohl(tcp->seq_num);
    uint32_t seg_ack = ntohl(tcp->ack_num);

    switch (conn->state) {
    case TCP_LISTEN:
        if (tcp->flags & TCP_SYN) {
            /* Step 2 (server side): received SYN, send SYN+ACK */
            conn->rcv_nxt = seg_seq + 1;
            conn->snd_nxt = tcp_generate_isn();
            conn->snd_una = conn->snd_nxt;
            conn->state   = TCP_SYN_RECEIVED;
            tcp_send_segment(conn, TCP_SYN | TCP_ACK, NULL, 0);
        }
        break;

    case TCP_SYN_SENT:
        if ((tcp->flags & (TCP_SYN | TCP_ACK)) == (TCP_SYN | TCP_ACK)) {
            /* Step 2 (client side): received SYN+ACK */
            conn->rcv_nxt = seg_seq + 1;
            conn->snd_una = seg_ack;
            conn->state   = TCP_ESTABLISHED;
            /* Step 3: Send ACK to complete handshake */
            tcp_send_segment(conn, TCP_ACK, NULL, 0);
        }
        break;

    case TCP_SYN_RECEIVED:
        if (tcp->flags & TCP_ACK) {
            /* Step 3 (server side): received ACK, connection open */
            conn->snd_una = seg_ack;
            conn->state   = TCP_ESTABLISHED;
        }
        break;

    case TCP_ESTABLISHED:
        /* Handle data and FIN — covered below */
        tcp_handle_established(conn, tcp, seg_len);
        break;

    /* ... other states for connection teardown ... */
    default:
        break;
    }
}` },
        { type: 'text', html: `
<h4>The TCP Pseudo-Header Checksum</h4>
<p>The TCP checksum is more involved than the IP checksum. TCP includes a <strong>pseudo-header</strong> in its checksum calculation: the source IP, destination IP, a zero byte, the protocol number (6 for TCP), and the TCP segment length. This pseudo-header is not transmitted on the wire — it exists only for checksum purposes.</p>

<p>Why does the pseudo-header exist? Because the TCP header itself does not contain IP addresses. Without the pseudo-header, a segment could be delivered to the wrong host or wrong protocol, and the TCP checksum alone would not catch the error. By including the IP addresses and protocol number in the checksum, TCP can detect segments that were misdelivered by the IP layer — for example, a corrupted destination address that causes a packet to arrive at the wrong machine.</p>
` },
        { type: 'code', label: 'tcp_checksum.c — TCP checksum with pseudo-header', code: `/*
 * TCP pseudo-header (RFC 793): used ONLY for checksum calculation,
 * never transmitted on the wire.
 *
 *   +--------+--------+--------+--------+
 *   |           Source Address            |
 *   +--------+--------+--------+--------+
 *   |         Destination Address         |
 *   +--------+--------+--------+--------+
 *   |  zero  |  PTCL  |    TCP Length    |
 *   +--------+--------+--------+--------+
 *
 * TCP Length = TCP header length + data length (in bytes)
 */
struct tcp_pseudo_header {
    uint32_t src_addr;
    uint32_t dst_addr;
    uint8_t  zero;
    uint8_t  protocol;    /* always 6 for TCP */
    uint16_t tcp_length;  /* TCP header + payload */
} __attribute__((packed));

/*
 * Compute the TCP checksum over pseudo-header + TCP header + data.
 * The checksum is the one's complement of the one's complement sum
 * of all 16-bit words.
 */
uint16_t tcp_checksum(const struct ip_header *ip,
                      const struct tcp_header *tcp,
                      const uint8_t *data, uint16_t data_len)
{
    uint16_t tcp_hdr_len = (tcp->data_offset >> 4) * 4;
    uint16_t tcp_total   = tcp_hdr_len + data_len;

    /* Build the pseudo-header */
    struct tcp_pseudo_header pseudo;
    pseudo.src_addr   = ip->src_addr;   /* already in network byte order */
    pseudo.dst_addr   = ip->dst_addr;
    pseudo.zero       = 0;
    pseudo.protocol   = IP_PROTO_TCP;   /* 6 */
    pseudo.tcp_length = htons(tcp_total);

    /* Sum the pseudo-header */
    uint32_t sum = 0;
    const uint16_t *w = (const uint16_t *)&pseudo;
    for (int i = 0; i < (int)sizeof(pseudo) / 2; i++)
        sum += w[i];

    /* Sum the TCP header (with checksum field set to 0) */
    w = (const uint16_t *)tcp;
    for (int i = 0; i < tcp_hdr_len / 2; i++)
        sum += w[i];

    /* Sum the payload data */
    w = (const uint16_t *)data;
    int remaining = data_len;
    while (remaining > 1) {
        sum += *w++;
        remaining -= 2;
    }
    /* If data length is odd, pad with a zero byte */
    if (remaining == 1)
        sum += *(const uint8_t *)w;

    /* Fold 32-bit sum into 16 bits */
    while (sum >> 16)
        sum = (sum & 0xFFFF) + (sum >> 16);

    return (uint16_t)(~sum);
}` },
        { type: 'text', html: `
<h4>The TCP State Machine</h4>
<p>TCP connections follow a precise state machine defined in RFC 793. Every connection is always in exactly one state. Understanding this diagram is essential:</p>
` },
        { type: 'diagram', content: `
TCP State Machine (Simplified)
================================

                              +--------+
                    --------->| CLOSED |<---------
                   |          +--------+          |
                   |               |              |
            passive open      active open     timeout/RST
                   |          (send SYN)          |
                   v               |              |
              +--------+          v          +-----------+
              | LISTEN |     +-----------+   | TIME_WAIT |
              +--------+     | SYN_SENT  |   +-----------+
                   |         +-----------+        ^
              recv SYN            |               |
             send SYN+ACK    recv SYN+ACK     recv ACK
                   |          send ACK            |
                   v               |         +-----------+
           +--------------+        v         | FIN_WAIT_2|
           | SYN_RECEIVED |   +-----------+  +-----------+
           +--------------+   |ESTABLISHED|       ^
                   |          +-----------+       |
              recv ACK             |          recv ACK
                   |          close/send FIN      |
                   v               |         +-----------+
              +-----------+        v         | FIN_WAIT_1|
              |ESTABLISHED|   +-----------+  +-----------+
              +-----------+   |FIN_WAIT_1 |       ^
                   |          +-----------+       |
              recv FIN             |          close
             send ACK         recv FIN+ACK    send FIN
                   |          send ACK            |
                   v               |              |
             +----------+         v          +-----------+
             |CLOSE_WAIT|    +-----------+   |ESTABLISHED|
             +----------+    | TIME_WAIT |   +-----------+
                   |         +-----------+
              close              (wait 2*MSL
             send FIN            then CLOSED)
                   |
                   v
             +----------+
             | LAST_ACK |
             +----------+
                   |
              recv ACK
                   |
                   v
              +--------+
              | CLOSED |
              +--------+

Normal client:  CLOSED -> SYN_SENT -> ESTABLISHED -> FIN_WAIT_1
                -> FIN_WAIT_2 -> TIME_WAIT -> CLOSED

Normal server:  CLOSED -> LISTEN -> SYN_RECEIVED -> ESTABLISHED
                -> CLOSE_WAIT -> LAST_ACK -> CLOSED` },
        { type: 'text', html: `
<h4>Sliding Window and Flow Control</h4>
<p>TCP doesn't wait for each segment to be acknowledged before sending the next. Instead, it uses a <strong>sliding window</strong> — the sender can have multiple unacknowledged segments "in flight" at once, up to the window size advertised by the receiver.</p>
` },
        { type: 'diagram', content: `
TCP Sliding Window
===================

Sender's view of the byte stream:

     Already ACKed    |  Sent, not ACKed  |  Can send  | Cannot send yet
  ...[=============]  |  [>>>>>>>>>>>>]   |  [-------] | [...............]
                      ^                   ^            ^
                   snd_una             snd_nxt    snd_una + snd_wnd

  snd_una = oldest unacknowledged byte (left edge of window)
  snd_nxt = next byte to send
  snd_wnd = receiver's advertised window size

Example with window size = 6 bytes:

  Time 1: Send bytes 1,2,3,4,5,6    (window full)
           [1][2][3][4][5][6] | cannot send 7,8,9...
            >>>>>>>>>>>>>>>>>>>

  Time 2: Receive ACK for 1,2,3     (window slides right)
           ACK  ACK  ACK [4][5][6][7][8][9] | cannot send 10...
                          >>>>>>>>>>>>>>>>>>>

  The window "slides" forward as ACKs arrive, allowing new data to be sent.
  This is much faster than stop-and-wait (send one, wait for ACK, repeat).` },
        { type: 'text', html: `
<h4>Connection Teardown (Four-Way Close)</h4>
<p>Closing a TCP connection requires four messages because each direction is closed independently — either side can finish sending while still receiving:</p>
` },
        { type: 'diagram', content: `
TCP Connection Teardown (Four-Way Close)
=========================================

  Client                                    Server
    |                                          |
    |  1. FIN  (seq=500)                       |
    |----------------------------------------->|  "I'm done sending."
    |                                          |
    |  2. ACK  (ack=501)                       |
    |<-----------------------------------------|  "Got it."
    |                                          |  (server may still send data)
    |                                          |
    |  3. FIN  (seq=700)                       |
    |<-----------------------------------------|  "I'm done sending too."
    |                                          |
    |  4. ACK  (ack=701)                       |
    |----------------------------------------->|  "Got it."
    |                                          |
    |    [TIME_WAIT: 2*MSL]                    |  [CLOSED]
    |                                          |
    |    [CLOSED]                              |

Why TIME_WAIT?
- Ensures the last ACK is delivered (if lost, server retransmits FIN)
- Allows old duplicate packets from this connection to expire
- MSL = Maximum Segment Lifetime (typically 2 minutes)
- So TIME_WAIT lasts ~4 minutes` },
        { type: 'code', label: 'tcp_data.c — Sending and receiving data on an established connection', code: `/* Send data over an established TCP connection */
int tcp_send(struct tcp_connection *conn,
             const uint8_t *data, uint16_t len)
{
    if (conn->state != TCP_ESTABLISHED)
        return -1;

    /* Respect the receiver's window */
    uint32_t in_flight = conn->snd_nxt - conn->snd_una;
    uint32_t available = conn->snd_wnd - in_flight;

    if (len > available)
        len = available;  /* Only send what the window allows */

    if (len == 0)
        return 0;  /* Window full, must wait for ACKs */

    /* Send data segment with PSH+ACK flags */
    tcp_send_segment(conn, TCP_ACK | TCP_PSH, data, len);
    return len;
}

/* Handle incoming data on an established connection */
void tcp_handle_established(struct tcp_connection *conn,
                            struct tcp_header *tcp, uint16_t seg_len)
{
    uint32_t seg_seq = ntohl(tcp->seq_num);
    uint32_t seg_ack = ntohl(tcp->ack_num);
    uint16_t data_len = seg_len - ((tcp->data_offset >> 4) * 4);
    uint8_t *data = (uint8_t *)tcp + ((tcp->data_offset >> 4) * 4);

    /* Update send window based on ACK */
    if (tcp->flags & TCP_ACK) {
        if (seg_ack > conn->snd_una && seg_ack <= conn->snd_nxt) {
            conn->snd_una = seg_ack;  /* Advance acknowledgment */
        }
        conn->snd_wnd = ntohs(tcp->window);
    }

    /* Process incoming data */
    if (data_len > 0 && seg_seq == conn->rcv_nxt) {
        /* In-order data — copy to receive buffer */
        memcpy(conn->rcv_buf + conn->rcv_buf_len, data, data_len);
        conn->rcv_buf_len += data_len;
        conn->rcv_nxt += data_len;

        /* Send ACK for received data */
        tcp_send_segment(conn, TCP_ACK, NULL, 0);
    }

    /* Handle FIN (peer wants to close) */
    if (tcp->flags & TCP_FIN) {
        conn->rcv_nxt = seg_seq + 1;
        conn->state = TCP_CLOSE_WAIT;
        tcp_send_segment(conn, TCP_ACK, NULL, 0);
    }
}

/* Close our side of the connection */
void tcp_close(struct tcp_connection *conn)
{
    if (conn->state == TCP_ESTABLISHED) {
        conn->state = TCP_FIN_WAIT_1;
        tcp_send_segment(conn, TCP_FIN | TCP_ACK, NULL, 0);
    } else if (conn->state == TCP_CLOSE_WAIT) {
        conn->state = TCP_LAST_ACK;
        tcp_send_segment(conn, TCP_FIN | TCP_ACK, NULL, 0);
    }
}` },
        { type: 'text', html: `
<h4>Getting Packets onto the Wire</h4>
<p>Our code builds IP and TCP headers in a byte buffer, but how does that buffer actually reach the network? In a real operating system, user-space programs cannot touch the network hardware directly — the kernel mediates all access. There are two common approaches for a user-space TCP/IP stack:</p>

<p><strong>Raw sockets</strong> (<code>socket(AF_INET, SOCK_RAW, IPPROTO_RAW)</code>) let you send hand-crafted IP packets directly. The kernel skips its own IP/TCP processing and hands your bytes to the network driver. This requires root privileges and works well for testing, but you are still using the kernel's Ethernet layer.</p>

<p><strong>TAP/TUN devices</strong> are virtual network interfaces. A TUN device operates at the IP layer (you read/write IP packets), while a TAP device operates at the Ethernet layer (you read/write full Ethernet frames including MAC headers). User-space TCP/IP stacks like lwIP and tapip use TAP devices so they control every byte from Ethernet up. You open <code>/dev/net/tun</code>, configure it with <code>ioctl()</code>, and then <code>read()</code>/<code>write()</code> complete frames.</p>
` },
        { type: 'code', label: 'net_send_packet — Stub for sending raw packets', code: `/*
 * Send a fully constructed packet (IP header + payload) out to the
 * network. This is platform-specific — here are the two main approaches:
 */

/* Option 1: Raw socket (simplest, requires root) */
#include <sys/socket.h>
#include <netinet/in.h>

static int raw_sock = -1;

void net_init_raw_socket(void) {
    raw_sock = socket(AF_INET, SOCK_RAW, IPPROTO_RAW);
    if (raw_sock < 0) {
        perror("socket(SOCK_RAW) — need root privileges");
    }
    /* Tell kernel we provide our own IP header */
    int one = 1;
    setsockopt(raw_sock, IPPROTO_IP, IP_HDRINCL, &one, sizeof(one));
}

void net_send_packet(const uint8_t *packet, int length) {
    /* Extract destination IP from the IP header we built */
    struct ip_header *ip = (struct ip_header *)packet;
    struct sockaddr_in dst;
    dst.sin_family = AF_INET;
    dst.sin_addr.s_addr = ip->dst_addr;  /* already in network order */

    sendto(raw_sock, packet, length, 0,
           (struct sockaddr *)&dst, sizeof(dst));
}

/* Option 2: TUN/TAP device (for a full user-space stack)
 *
 *   int tun_fd = open("/dev/net/tun", O_RDWR);
 *   struct ifreq ifr = { .ifr_flags = IFF_TUN | IFF_NO_PI };
 *   strncpy(ifr.ifr_name, "tun0", IFNAMSIZ);
 *   ioctl(tun_fd, TUNSETIFF, &ifr);
 *
 *   // Now read/write IP packets via tun_fd:
 *   write(tun_fd, packet, length);   // send
 *   read(tun_fd, buffer, bufsize);   // receive
 */` },
        { type: 'info', variant: 'warning', title: 'This Is a Simplified Implementation',
          html: `<p>A production TCP stack handles many more edge cases: out-of-order segments, retransmission timers, congestion control (slow start, congestion avoidance), Nagle's algorithm, silly window syndrome, SACK, timestamps, and more. Our implementation covers the core concepts. For the full specification, read <strong>RFC 793</strong> (original TCP) and <strong>RFC 7414</strong> (roadmap to TCP RFCs).</p>` },
        { type: 'video', id: 'F27PLin3TV0', title: 'TCP/IP Explained — the fundamentals of networking' },
        { type: 'video', id: 'rmFX1V49K8U', title: 'TCP Three-Way Handshake — Sunny Classroom' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the IP checksum function and verify it against known-good packets captured with Wireshark',
          'Write a program that constructs a raw IP packet by hand (filling every header field) and sends it using a raw socket (<code>socket(AF_INET, SOCK_RAW, IPPROTO_RAW)</code>)',
          'Implement the TCP checksum calculation including the pseudo-header (source IP, dest IP, zero, protocol, TCP length)',
          'Build the full TCP three-way handshake: write a client that sends SYN, receives SYN+ACK, and sends ACK — verify with Wireshark',
          'Implement the TCP state machine as a switch statement covering all 11 states. Write tests that walk through the normal open/data/close sequence.',
          'Add a retransmission timer: if no ACK arrives within 1 second, resend the unacknowledged segment',
          'Use <code>tcpdump</code> or Wireshark to capture a real TCP connection and identify every field in the headers you see',
        ]},
        { type: 'resources', links: [
          { type: 'RFC', title: 'RFC 793 — Transmission Control Protocol', url: 'https://tools.ietf.org/html/rfc793', desc: 'The original TCP specification — dense but essential' },
          { type: 'RFC', title: 'RFC 791 — Internet Protocol', url: 'https://tools.ietf.org/html/rfc791', desc: 'The original IP specification' },
          { type: 'Book', title: 'TCP/IP Illustrated, Vol. 1 by W. Richard Stevens', url: 'https://www.amazon.com/TCP-Illustrated-Vol-Addison-Wesley-Professional/dp/0201633469', desc: 'The definitive guide to TCP/IP internals' },
          { type: 'Tutorial', title: "Beej's Guide to Network Programming", url: 'https://beej.us/guide/bgnet/', desc: 'Excellent practical guide to socket programming in C' },
          { type: 'Project', title: 'tapip — A user-space TCP/IP stack', url: 'https://github.com/chobits/tapip', desc: 'Open-source TCP/IP stack implementation for learning' },
        ]},
      ],
    },
    {
      id: 2,
      title: "Building a Telnet Server",
      subtitle: "Multi-user networking with fork and sockets",
      duration: "2 hours",
      content: [
        { type: 'text', html: `
<h2>Telnet: The Simplest Network Application</h2>
<p>Now that we have a TCP/IP stack, let's build something with it. <strong>Telnet</strong> is one of the oldest Internet protocols (RFC 854, from 1983). At its core, it's dead simple: open a TCP connection to port 23 and send keystrokes back and forth as plain text. The server connects the TCP stream to a shell, and you have remote terminal access.</p>

<p>Telnet is perfect as our first networking application because it exercises the full stack with minimal protocol complexity — it's essentially "TCP + a shell."</p>

<h3>The Socket API</h3>
<p>Before we build the server, we need to understand the <strong>BSD socket API</strong> — the standard interface for network programming in C (and the model for every other language). A socket is a file descriptor that represents a network endpoint.</p>
` },
        { type: 'diagram', content: `
TCP Server Socket Lifecycle
============================

   Server                            Client
   ------                            ------

   socket()    Create endpoint
      |
   bind()      Assign address:port
      |
   listen()    Mark as passive (accepting connections)
      |
      v
   accept()    Block until client connects  <------ connect()
      |                                               |
      v                                               |
   [new fd]    Connected socket for this client       |
      |                                               |
   read() <------- TCP data -------------------------write()
   write() ------> TCP data ------------------------>read()
      |                                               |
   close()     Done with this client             close()


For multiple clients, the server fork()s after accept():

   accept() --> fork() --> child: handle client
                  |
                  +--> parent: go back to accept()` },
        { type: 'code', label: 'telnet_server.c — A complete multi-user telnet server', code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/wait.h>
#include <netinet/in.h>
#include <signal.h>
#include <errno.h>
#include <pty.h>       /* forkpty() — Linux; use <util.h> on macOS */

#define TELNET_PORT 2323   /* Use unprivileged port for testing */
#define BUF_SIZE    1024

/*
 * Handle SIGCHLD to reap zombie child processes.
 * When a forked child exits, the parent must call wait()
 * or the child becomes a zombie.
 */
void sigchld_handler(int sig) {
    (void)sig;
    while (waitpid(-1, NULL, WNOHANG) > 0)
        ;
}

/*
 * Relay data between the client socket and the pseudo-terminal.
 * This is the heart of the telnet server — it just shuffles bytes
 * between the network and the shell.
 */
void handle_client(int client_fd, int pty_master) {
    fd_set readfds;
    char buf[BUF_SIZE];
    int maxfd = (client_fd > pty_master ? client_fd : pty_master) + 1;

    while (1) {
        FD_ZERO(&readfds);
        FD_SET(client_fd, &readfds);
        FD_SET(pty_master, &readfds);

        if (select(maxfd, &readfds, NULL, NULL, NULL) < 0) {
            if (errno == EINTR) continue;
            break;
        }

        /* Data from network -> shell */
        if (FD_ISSET(client_fd, &readfds)) {
            ssize_t n = read(client_fd, buf, BUF_SIZE);
            if (n <= 0) break;
            write(pty_master, buf, n);
        }

        /* Data from shell -> network */
        if (FD_ISSET(pty_master, &readfds)) {
            ssize_t n = read(pty_master, buf, BUF_SIZE);
            if (n <= 0) break;
            write(client_fd, buf, n);
        }
    }
}

int main(void) {
    int server_fd, client_fd;
    struct sockaddr_in addr;
    socklen_t addr_len = sizeof(addr);

    /* Set up SIGCHLD handler to prevent zombie processes */
    struct sigaction sa;
    sa.sa_handler = sigchld_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    sigaction(SIGCHLD, &sa, NULL);

    /* 1. Create the listening socket */
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); exit(1); }

    /* Allow address reuse (avoids "address already in use" on restart) */
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    /* 2. Bind to port */
    memset(&addr, 0, sizeof(addr));
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);  /* Listen on all interfaces */
    addr.sin_port        = htons(TELNET_PORT);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); exit(1);
    }

    /* 3. Listen for connections (backlog of 5) */
    if (listen(server_fd, 5) < 0) {
        perror("listen"); exit(1);
    }

    printf("Telnet server listening on port %d\\n", TELNET_PORT);

    /* 4. Accept loop — one fork per client */
    while (1) {
        client_fd = accept(server_fd, (struct sockaddr *)&addr, &addr_len);
        if (client_fd < 0) {
            if (errno == EINTR) continue;
            perror("accept"); continue;
        }

        printf("Client connected\\n");

        pid_t pid = fork();
        if (pid < 0) {
            perror("fork");
            close(client_fd);
            continue;
        }

        if (pid == 0) {
            /* === CHILD PROCESS === */
            close(server_fd);  /* Child doesn't need the listening socket */

            int pty_master;
            pid_t shell_pid = forkpty(&pty_master, NULL, NULL, NULL);

            if (shell_pid < 0) {
                perror("forkpty");
                exit(1);
            }

            if (shell_pid == 0) {
                /* === GRANDCHILD: becomes the shell === */
                execlp("/bin/sh", "sh", NULL);
                perror("exec");
                exit(1);
            }

            /* === CHILD: relay between socket and pty === */
            handle_client(client_fd, pty_master);

            close(pty_master);
            close(client_fd);
            exit(0);
        }

        /* === PARENT: go back to accepting === */
        close(client_fd);  /* Parent doesn't need the client socket */
    }

    return 0;
}` },
        { type: 'text', html: `
<h3>How It Works: The Process Architecture</h3>
<p>Each client connection creates this process tree:</p>
` },
        { type: 'diagram', content: `
Process Architecture of the Telnet Server
============================================

  telnet_server (parent)
       |
       | accept() returns new client socket
       |
       +-- fork() --> child process
       |                  |
       |                  +-- forkpty() --> grandchild process
       |                  |                     |
       |                  |                  exec("/bin/sh")
       |                  |                     |
       |                  |                  Shell running in
       |                  |                  pseudo-terminal
       |                  |
       |                  +-- select() loop:
       |                       socket <--> pty_master
       |                       (relay bytes both ways)
       |
       | (back to accept() for next client)


  forkpty() creates a pseudo-terminal pair:
  +------------------+          +------------------+
  | pty_master (fd)  |<-------->| pty_slave (/dev/) |
  | (parent side)    |          | (child side)     |
  +------------------+          +------------------+
        |                              |
    server reads/writes          shell reads/writes
    to relay to network          as if it's a real terminal

  Why pseudo-terminals?
  - The shell thinks it's talking to a real terminal
  - Line editing, signal handling, job control all work correctly
  - Without a PTY, programs like 'vi' or 'top' would break` },
        { type: 'text', html: `
<h3>Key System Calls Explained</h3>

<h4>select() — Waiting on Multiple File Descriptors</h4>
<p>The <code>select()</code> system call lets a process wait for activity on multiple file descriptors simultaneously — without busy-looping. In our telnet server, the child process needs to watch two file descriptors at once: the client socket (for incoming keystrokes from the network) and the pty master (for output from the shell). Without <code>select()</code>, you would need two threads, one blocking on each <code>read()</code>. With <code>select()</code>, a single thread can wait for whichever becomes ready first.</p>

<p>The function signature is: <code>int select(int nfds, fd_set *readfds, fd_set *writefds, fd_set *exceptfds, struct timeval *timeout)</code>. The <code>fd_set</code> type is a bitmask representing a set of file descriptors. You manipulate it with macros: <code>FD_ZERO()</code> clears the set, <code>FD_SET(fd, &set)</code> adds a descriptor, and <code>FD_ISSET(fd, &set)</code> checks if a descriptor is ready after <code>select()</code> returns. The first argument <code>nfds</code> must be set to the highest-numbered file descriptor plus one — this tells the kernel how many bits in the bitmask to scan. Passing <code>maxfd + 1</code> is a common idiom. When <code>select()</code> returns, the fd_sets are modified in place to indicate which descriptors are ready.</p>

<h4>forkpty() — Creating a Pseudo-Terminal and Forking</h4>
<p><code>forkpty()</code> combines three operations into one call: it creates a pseudo-terminal pair (master and slave), calls <code>fork()</code>, and connects the child process's stdin/stdout/stderr to the slave side of the pseudo-terminal. The signature is: <code>pid_t forkpty(int *amaster, char *name, struct termios *termp, struct winsize *winp)</code>. The first parameter <code>amaster</code> receives the file descriptor for the master side of the pty. The second parameter <code>name</code>, if non-NULL, receives the filename of the slave device (e.g., <code>/dev/pts/3</code>). The third and fourth parameters set terminal attributes and window size for the slave — passing NULL for both uses defaults.</p>

<p>The return value follows fork() semantics: in the parent, it returns the child's PID (positive); in the child, it returns 0; on error, it returns -1. The parent reads from and writes to the master fd, and those bytes appear as terminal I/O in the child. This is what makes the shell believe it is running in a real terminal, enabling features like line editing and cursor control.</p>

<h4>Platform Note: Header File Differences</h4>
<p>The <code>forkpty()</code> function lives in different headers on different systems. On Linux, you include <code>&lt;pty.h&gt;</code> and link with <code>-lutil</code>. On macOS (and other BSD systems), you include <code>&lt;util.h&gt;</code> instead — there is no <code>&lt;pty.h&gt;</code> and no need to link <code>-lutil</code> because the function is part of the standard C library. If you need portability, use a preprocessor check:</p>
` },
        { type: 'code', label: 'Portable forkpty() include', code: `#ifdef __APPLE__
  #include <util.h>       /* macOS / BSD: forkpty() lives here */
#else
  #include <pty.h>        /* Linux: forkpty() lives here       */
#endif` },
        { type: 'text', html: `
<h3>Testing Your Telnet Server</h3>
<p>Compile and run the server, then connect to it from another terminal:</p>
` },
        { type: 'code', label: 'Building and testing', code: `# Compile (on Linux, link with -lutil for forkpty)
gcc -o telnet_server telnet_server.c -lutil

# Run the server
./telnet_server
# Output: Telnet server listening on port 2323

# In another terminal, connect with telnet or netcat:
telnet localhost 2323
# Or:
nc localhost 2323

# You should get a shell prompt. Try running commands:
$ ls
$ whoami
$ echo "Hello from telnet!"

# Each new connection gets its own shell.
# Open multiple terminals and connect simultaneously.` },
        { type: 'info', variant: 'warning', title: 'Telnet Is Not Secure',
          html: `<p>Telnet sends everything in <strong>plain text</strong>, including passwords. It was replaced by SSH (Secure Shell) which encrypts all traffic. We use telnet here for its educational simplicity — it demonstrates multi-process networking without cryptographic complexity. <strong>Never use telnet for real remote access over untrusted networks.</strong></p>` },
        { type: 'text', html: `
<h3>Understanding fork() and File Descriptor Inheritance</h3>
<p>When a process calls <code>fork()</code>, the child gets a <strong>copy of all open file descriptors</strong>. This is why the pattern works:</p>
<ol>
<li>Parent creates the listening socket (server_fd)</li>
<li>Parent calls <code>accept()</code> which returns a new connected socket (client_fd)</li>
<li>Parent calls <code>fork()</code> — child inherits both server_fd and client_fd</li>
<li>Child closes server_fd (doesn't need it) and handles client_fd</li>
<li>Parent closes client_fd (the child has its own copy) and loops back to accept</li>
</ol>
<p>This "fork after accept" pattern is one of the oldest concurrent server designs in Unix. It's simple, robust, and how servers worked for decades before threads and event loops became popular.</p>
` },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Build and run the telnet server. Connect two clients simultaneously and verify they each get independent shells.',
          'Add a login prompt: before spawning a shell, ask for a username and password (hardcoded is fine — this is for learning, not security)',
          'Add logging: record each client connection (timestamp, IP address) and disconnection to a log file',
          'Replace the fork-per-client model with a single-process event loop using <code>select()</code> or <code>poll()</code> to handle multiple clients',
          'Implement basic Telnet protocol negotiation: handle the IAC (Interpret As Command, byte 0xFF) escape sequences for terminal type and echo mode',
          'Add a "message of the day" (MOTD) that is displayed to each client upon connection',
          'Measure the overhead of fork() vs threads: modify the server to use <code>pthread_create()</code> instead and compare memory usage with many concurrent clients',
        ]},
        { type: 'resources', links: [
          { type: 'RFC', title: 'RFC 854 — Telnet Protocol Specification', url: 'https://tools.ietf.org/html/rfc854', desc: 'The official telnet protocol definition' },
          { type: 'Tutorial', title: "Beej's Guide to Network Programming", url: 'https://beej.us/guide/bgnet/', desc: 'The classic guide to C socket programming' },
          { type: 'Article', title: 'The Linux Programming Interface: Pseudo-terminals', url: 'https://man7.org/linux/man-pages/man7/pty.7.html', desc: 'Man page explaining pseudo-terminal architecture' },
          { type: 'Video', title: 'Jacob Sorber: Fork and Exec Explained', url: 'https://www.youtube.com/watch?v=l64ySYHmMmY', desc: 'Clear explanation of process creation in Unix' },
        ]},
      ],
    },
    {
      id: 3,
      title: "Dynamic Linking",
      subtitle: "Sharing code at runtime with GOT and PLT",
      duration: "2 hours",
      content: [
        { type: 'text', html: `
<h2>Why Dynamic Linking?</h2>
<p>So far, our programs have been <strong>statically linked</strong> — the linker copies all library code directly into the executable. This works, but it has significant downsides:</p>

<ul>
<li><strong>Wasted disk space:</strong> Every program has its own copy of libc, libm, etc.</li>
<li><strong>Wasted memory:</strong> When 50 programs run, there are 50 copies of printf() in RAM</li>
<li><strong>No updates without recompilation:</strong> Fix a bug in libc? Recompile every program.</li>
</ul>

<p><strong>Dynamic linking</strong> solves all three problems by loading shared libraries (.so on Linux, .dylib on macOS, .dll on Windows) at runtime. All programs share a single copy of each library, both on disk and in memory.</p>
` },
        { type: 'diagram', content: `
Static vs Dynamic Linking
===========================

STATIC LINKING:
                                      Executable
  main.o ----+                  +-------------------+
             |     Linker       |  main code        |
  libc.a ----+---> (ld) -----> |  printf (COPIED)  |  5 MB
             |                  |  malloc (COPIED)  |
  libm.a ----+                  |  sin (COPIED)     |
                                +-------------------+
  Every executable has its own copy of everything.


DYNAMIC LINKING:
                                      Executable
  main.o ----+                  +-------------------+
             |     Linker       |  main code        |
  libc.so ---+---> (ld) -----> |  ref: printf      |  50 KB
             |  (records refs)  |  ref: malloc      |
  libm.so ---+                  |  ref: sin         |
                                +-------------------+
                                        |
                        At runtime, dynamic linker (ld.so)
                        loads shared libraries and resolves references:
                                        |
                         +-----> libc.so (shared by ALL programs)
                         +-----> libm.so (shared by ALL programs)

  Result: smaller executables, shared memory, easier updates.` },
        { type: 'text', html: `
<h3>The Problem: Position-Independent Code</h3>
<p>There's a fundamental challenge with shared libraries: they can be loaded at <strong>any address</strong> in memory. If program A loads libc.so at address 0x7f000000 and program B loads it at 0x7f500000, the code must work at both addresses. This means the library code can't contain hardcoded absolute addresses.</p>

<p>The solution is <strong>Position-Independent Code (PIC)</strong>: code that references everything relative to its own position, using two special data structures: the <strong>GOT</strong> and the <strong>PLT</strong>.</p>

<h3>GOT: Global Offset Table</h3>
<p>The GOT is a table of pointers in the data section. When code needs to access a global variable or function from another library, it goes through the GOT. The dynamic linker fills in the actual addresses at load time.</p>
` },
        { type: 'diagram', content: `
The Global Offset Table (GOT)
==============================

Without GOT (static linking — absolute addresses):
  call 0x7f001234      ; hardcoded address of printf
                        ; BREAKS if library moves!

With GOT (dynamic linking — indirect through table):
  call [GOT + 16]      ; load address from GOT entry
                        ; GOT[16] = actual address of printf
                        ; dynamic linker fills this in

Memory layout:
  +------------------+
  | .text (code)     |  Program code (read-only, shared)
  |   call [GOT+16]  |--+
  +------------------+  |
                        |
  +------------------+  |   Filled in by dynamic linker:
  | .got (GOT)       |<-+
  |  [0] = &stdout   |  --> actual address of stdout
  |  [8] = &errno    |  --> actual address of errno
  | [16] = &printf   |  --> actual address of printf
  | [24] = &malloc   |  --> actual address of malloc
  +------------------+

  The GOT is in writable memory (each process has its own copy).
  The code is in read-only memory (shared between processes).` },
        { type: 'text', html: `
<h3>PLT: Procedure Linkage Table</h3>
<p>The PLT adds <strong>lazy binding</strong> — function addresses aren't resolved until the function is actually called for the first time. This makes program startup faster because the dynamic linker doesn't need to resolve thousands of symbols up front.</p>
` },
        { type: 'diagram', content: `
PLT Lazy Binding (first call to printf)
=========================================

Step 1: Code calls printf via PLT stub

  main:
      call printf@PLT        ; jump to PLT entry for printf

Step 2: PLT stub jumps through GOT (initially points back to PLT)

  printf@PLT:
      jmp [GOT_printf]       ; first time: GOT points to next instruction!
      push 3                 ; push relocation index onto stack
      jmp PLT[0]             ; jump to dynamic linker resolver

Step 3: Dynamic linker resolves the symbol

  PLT[0] (resolver stub):
      push [GOT+8]           ; push link_map (identifies this library)
      jmp  [GOT+16]          ; call _dl_runtime_resolve()

  _dl_runtime_resolve():
      1. Look up "printf" in libc.so's symbol table
      2. Get the actual address: 0x7f12345678
      3. PATCH the GOT entry: GOT_printf = 0x7f12345678
      4. Jump to printf (the real one)

Step 4: Second call to printf (GOT already patched)

  printf@PLT:
      jmp [GOT_printf]       ; GOT now contains real address!
      (jumps directly to printf — no resolver needed)

This is brilliant:
- First call: slow (resolver runs, patches GOT)
- All subsequent calls: fast (direct jump through GOT)
- Functions never called are never resolved (saves startup time)` },
        { type: 'code', label: 'Examining GOT and PLT with real tools', code: `# Compile a simple program with dynamic linking
cat > hello.c << 'EOF'
#include <stdio.h>
#include <math.h>

int main(void) {
    printf("Hello, dynamic world!\\n");
    printf("sqrt(2) = %f\\n", sqrt(2.0));
    return 0;
}
EOF

gcc -o hello hello.c -lm

# Show dynamic dependencies
ldd hello
#   linux-vdso.so.1
#   libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6
#   libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
#   /lib64/ld-linux-x86-64.so.2

# Examine the PLT entries
objdump -d -j .plt hello
# Shows the PLT stubs for printf, sqrt, etc.

# Examine the GOT
objdump -R hello
# Shows relocation entries that the dynamic linker will fill in

# Watch lazy binding in action with GDB:
gdb ./hello
(gdb) break *printf@plt
(gdb) run
(gdb) x/3i $pc          # See the PLT stub
(gdb) x/gx 0xADDR       # Examine GOT entry (before resolution)
(gdb) continue           # Let it resolve
(gdb) x/gx 0xADDR       # GOT entry now holds real printf address

# Or use LD_DEBUG to see the dynamic linker at work:
LD_DEBUG=bindings ./hello 2>&1 | head -30
# Shows every symbol resolution` },
        { type: 'text', html: `
<h3>Implementing a Simple Dynamic Loader</h3>
<p>To truly understand dynamic linking, let's write a minimal dynamic loader. It loads a shared library, resolves a symbol, and calls it:</p>
` },
        { type: 'code', label: 'miniloader.c — A minimal dynamic loader using dlopen/dlsym', code: `#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>   /* dlopen, dlsym, dlclose */

/*
 * miniloader: Load a shared library at runtime, find a function
 * by name, and call it. This is what the dynamic linker does
 * automatically — we're doing it explicitly to understand the process.
 */
int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <library.so> <function_name>\\n", argv[0]);
        fprintf(stderr, "Example: %s libm.so.6 cos\\n", argv[0]);
        return 1;
    }

    const char *lib_path  = argv[1];
    const char *func_name = argv[2];

    /* Step 1: Load the shared library into our address space */
    printf("[loader] Loading library: %s\\n", lib_path);
    void *handle = dlopen(lib_path, RTLD_LAZY);  /* RTLD_LAZY = lazy binding */
    if (!handle) {
        fprintf(stderr, "[loader] dlopen failed: %s\\n", dlerror());
        return 1;
    }
    printf("[loader] Library loaded at handle %p\\n", handle);

    /* Step 2: Look up the symbol by name */
    printf("[loader] Resolving symbol: %s\\n", func_name);
    dlerror();  /* clear any old error */
    void *sym = dlsym(handle, func_name);
    char *err = dlerror();
    if (err) {
        fprintf(stderr, "[loader] dlsym failed: %s\\n", err);
        dlclose(handle);
        return 1;
    }
    printf("[loader] Symbol '%s' found at address %p\\n", func_name, sym);

    /* Step 3: Call the function (assuming it takes a double, returns double) */
    typedef double (*math_func)(double);
    math_func fn = (math_func)sym;

    double input = 2.0;
    double result = fn(input);
    printf("[loader] %s(%f) = %f\\n", func_name, input, result);

    /* Step 4: Unload the library */
    dlclose(handle);
    printf("[loader] Library unloaded\\n");

    return 0;
}

/* Compile and run:
 *   gcc -o miniloader miniloader.c -ldl
 *   ./miniloader libm.so.6 sqrt
 *   ./miniloader libm.so.6 cos
 *   ./miniloader libm.so.6 sin
 */` },
        { type: 'code', label: 'make_shared_lib.c — Creating and loading your own shared library', code: `/* === mylib.c === */
#include <stdio.h>

/* Every function will be visible in the dynamic symbol table */
void greet(const char *name) {
    printf("Hello, %s! Greetings from a shared library.\\n", name);
}

int add(int a, int b) {
    return a + b;
}

double circle_area(double radius) {
    return 3.14159265358979323846 * radius * radius;
}

/* === Build the shared library === */
// gcc -shared -fPIC -o libmylib.so mylib.c
//
// -shared: produce a shared object (.so file)
// -fPIC:   generate Position-Independent Code (required for shared libs)

/* === main.c — Use it at compile time === */
// #include <stdio.h>
// extern void greet(const char *name);
// extern int add(int a, int b);
//
// int main(void) {
//     greet("World");
//     printf("3 + 4 = %d\\n", add(3, 4));
//     return 0;
// }
//
// gcc -o main main.c -L. -lmylib
// LD_LIBRARY_PATH=. ./main

/* === Or use the miniloader to call functions dynamically === */
// ./miniloader ./libmylib.so greet
// (would need to adjust miniloader's calling convention)` },
        { type: 'info', variant: 'info', title: 'How the Dynamic Linker Finds Libraries',
          html: `<p>When you run a dynamically linked program, the kernel loads the program AND the dynamic linker (<code>/lib64/ld-linux-x86-64.so.2</code> on Linux). The dynamic linker then finds all needed libraries using this search order:</p>
<ol>
<li><strong>DT_RPATH</strong> — embedded in the ELF binary (deprecated)</li>
<li><strong>LD_LIBRARY_PATH</strong> — environment variable</li>
<li><strong>DT_RUNPATH</strong> — embedded in the ELF binary</li>
<li><strong>/etc/ld.so.cache</strong> — precomputed cache from <code>ldconfig</code></li>
<li><strong>/lib, /usr/lib</strong> — default system directories</li>
</ol>
<p>You can see the dynamic linker's decisions with: <code>LD_DEBUG=libs ./your_program</code></p>` },
        { type: 'video', id: 'dOfucXtyEsU', title: 'Dynamic Linking — how shared libraries work (Chris Kanich)' },
        { type: 'video', id: '_enXuIxuNV4', title: 'Understanding the ELF file format' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Compile a program both statically (<code>gcc -static</code>) and dynamically. Compare file sizes with <code>ls -la</code> and library dependencies with <code>ldd</code>.',
          'Write a shared library with three functions. Compile it with <code>-shared -fPIC</code>, link against it, and run it with <code>LD_LIBRARY_PATH</code>.',
          'Use <code>objdump -d -j .plt</code> and <code>objdump -R</code> to examine the PLT and GOT of a dynamically linked binary. Identify each PLT stub and its corresponding GOT entry.',
          'Use GDB to observe lazy binding: set a breakpoint at a PLT entry, examine the GOT before and after the first call to see the address change.',
          'Extend the miniloader to handle functions with different signatures (string argument, two int arguments, etc.) using function pointer casts.',
          'Use <code>LD_DEBUG=all</code> to trace the complete dynamic linking process. Identify every step: library loading, symbol resolution, relocation processing.',
          'Write a "plugin system": a main program that loads .so files from a directory and calls a standard entry point (<code>plugin_init()</code>) in each one.',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'Eli Bendersky: Position Independent Code and PLT', url: 'https://eli.thegreenplace.net/2011/11/03/position-independent-code-pic-in-shared-libraries', desc: 'Excellent deep dive into PIC, GOT, and PLT with x86 examples' },
          { type: 'Article', title: 'Ian Lance Taylor: Linkers (20-part series)', url: 'https://lwn.net/Articles/276782/', desc: 'Comprehensive series on how linkers work by a GCC/gold developer' },
          { type: 'Manual', title: 'dlopen(3) man page', url: 'https://man7.org/linux/man-pages/man3/dlopen.3.html', desc: 'API reference for runtime dynamic loading' },
          { type: 'Book', title: 'Linkers and Loaders by John Levine', url: 'https://www.amazon.com/Linkers-Loaders-John-R-Levine/dp/1558604960', desc: 'The definitive book on linking and loading' },
        ]},
      ],
    },
    {
      id: 4,
      title: "HTTP Protocol and Web Requests",
      subtitle: "The language of the World Wide Web",
      duration: "2.5 hours",
      content: [
        { type: 'text', html: `
<h2>HTTP: How the Web Works</h2>
<p>The <strong>Hypertext Transfer Protocol (HTTP)</strong> is the application-layer protocol that powers the World Wide Web. Every time you load a web page, your browser sends an HTTP request and the server sends back an HTTP response. It's a simple text-based request/response protocol that runs on top of TCP.</p>

<p>HTTP is elegant in its simplicity. At its core, it's just structured text over a TCP connection. Let's understand every piece of it.</p>

<h3>Anatomy of an HTTP Request</h3>
<p>An HTTP request consists of a request line, headers, and an optional body:</p>
` },
        { type: 'diagram', content: `
HTTP Request Format
====================

  +----------------------------------------------------------+
  | Request Line:  METHOD  PATH  HTTP/VERSION                |
  | Example:       GET /index.html HTTP/1.1                  |
  +----------------------------------------------------------+
  | Headers (key: value pairs, one per line):                |
  |                                                          |
  | Host: www.example.com                                    |
  | User-Agent: MiniBrowser/1.0                              |
  | Accept: text/html                                        |
  | Connection: close                                        |
  +----------------------------------------------------------+
  | (blank line — \\r\\n — separates headers from body)        |
  +----------------------------------------------------------+
  | Body (optional, used with POST/PUT):                     |
  | username=alice&password=secret                           |
  +----------------------------------------------------------+

A complete GET request as raw bytes:
"GET /index.html HTTP/1.1\\r\\n"
"Host: www.example.com\\r\\n"
"User-Agent: MiniBrowser/1.0\\r\\n"
"Accept: text/html\\r\\n"
"Connection: close\\r\\n"
"\\r\\n"

Note: Every line ends with \\r\\n (CRLF).
The blank line (just \\r\\n) marks the end of headers.` },
        { type: 'text', html: `
<h3>HTTP Methods</h3>
<p>The method tells the server what you want to do:</p>
` },
        { type: 'table', headers: ['Method', 'Purpose', 'Has Body?', 'Idempotent?'],
          rows: [
            ['<strong>GET</strong>', 'Retrieve a resource', 'No', 'Yes'],
            ['<strong>POST</strong>', 'Submit data (create)', 'Yes', 'No'],
            ['<strong>PUT</strong>', 'Replace a resource', 'Yes', 'Yes'],
            ['<strong>DELETE</strong>', 'Delete a resource', 'No', 'Yes'],
            ['<strong>HEAD</strong>', 'GET without the body (check if resource exists)', 'No', 'Yes'],
            ['<strong>OPTIONS</strong>', 'Ask what methods are supported', 'No', 'Yes'],
          ]
        },
        { type: 'text', html: `
<p>The "Idempotent?" column is an important concept: an <strong>idempotent</strong> request is one that produces the same result whether you send it once or multiple times. GET is idempotent — requesting the same page ten times gives you the same page, with no side effects on the server. POST is not idempotent — submitting an order form ten times creates ten orders. This distinction matters for retries: if a network error occurs, the client can safely retry an idempotent request, but retrying a non-idempotent POST might duplicate the action.</p>

<h3>Anatomy of an HTTP Response</h3>
` },
        { type: 'diagram', content: `
HTTP Response Format
=====================

  +----------------------------------------------------------+
  | Status Line:  HTTP/VERSION  STATUS_CODE  REASON_PHRASE   |
  | Example:      HTTP/1.1 200 OK                            |
  +----------------------------------------------------------+
  | Headers:                                                 |
  |                                                          |
  | Content-Type: text/html; charset=UTF-8                   |
  | Content-Length: 137                                       |
  | Server: Apache/2.4                                       |
  | Date: Mon, 08 Mar 2026 12:00:00 GMT                     |
  | Connection: close                                        |
  +----------------------------------------------------------+
  | (blank line — \\r\\n)                                      |
  +----------------------------------------------------------+
  | Body:                                                    |
  | <html>                                                   |
  | <head><title>Hello</title></head>                        |
  | <body><h1>Hello, World!</h1></body>                      |
  | </html>                                                  |
  +----------------------------------------------------------+

The Content-Length header tells you exactly how many bytes
are in the body. Without it, the client reads until the
connection closes (with Connection: close).` },
        { type: 'text', html: `
<h3>HTTP Status Codes</h3>
<p>The status code is a three-digit number that tells the client what happened:</p>
` },
        { type: 'table', headers: ['Code', 'Category', 'Common Examples'],
          rows: [
            ['<strong>1xx</strong>', 'Informational', '100 Continue'],
            ['<strong>2xx</strong>', 'Success', '200 OK, 201 Created, 204 No Content'],
            ['<strong>3xx</strong>', 'Redirection', '301 Moved Permanently, 302 Found, 304 Not Modified'],
            ['<strong>4xx</strong>', 'Client Error', '400 Bad Request, 403 Forbidden, 404 Not Found, 405 Method Not Allowed'],
            ['<strong>5xx</strong>', 'Server Error', '500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable'],
          ]
        },
        { type: 'text', html: `
<h3>How a Web Request Flows</h3>
<p>Let's trace the complete journey of typing "http://www.example.com/page.html" in a browser:</p>
` },
        { type: 'diagram', content: `
Complete Flow of an HTTP Request
==================================

  Browser                                    Internet                  Server
  -------                                    --------                  ------

  1. Parse URL
     scheme: http
     host: www.example.com
     port: 80 (default)
     path: /page.html

  2. DNS Lookup
     "What IP is www.example.com?"
     ---------------------------------------->
     <----------------------------------------
     "93.184.216.34"

  3. TCP Connection (3-way handshake)
     SYN ------------------------------------------>
     <------------------------------------------ SYN+ACK
     ACK ------------------------------------------>

  4. Send HTTP Request
     "GET /page.html HTTP/1.1\\r\\n"
     "Host: www.example.com\\r\\n"
     "\\r\\n"
     ------------------------------------------>

  5. Server Processes Request                         Read /page.html
                                                      from disk
                                                      Build response

  6. Receive HTTP Response
     <------------------------------------------
     "HTTP/1.1 200 OK\\r\\n"
     "Content-Type: text/html\\r\\n"
     "Content-Length: 2048\\r\\n"
     "\\r\\n"
     "<html>...</html>"

  7. TCP Teardown (4-way close)
     FIN ------------------------------------------>
     <------------------------------------------ ACK
     <------------------------------------------ FIN
     ACK ------------------------------------------>

  8. Parse HTML and Render                            Done.` },
        { type: 'text', html: `
<h3>DNS: Translating Hostnames to IP Addresses</h3>
<p>Before a browser can open a TCP connection, it needs the server's IP address. But humans use hostnames like <code>www.example.com</code>, not numbers like <code>93.184.216.34</code>. The <strong>Domain Name System (DNS)</strong> is the distributed database that maps hostnames to IP addresses. It works like a phone book for the Internet: your computer asks a DNS resolver "what is the IP address of www.example.com?", and the resolver queries a hierarchy of DNS servers (root servers, TLD servers, authoritative servers) until it gets an answer.</p>

<p>In C, the traditional function for DNS lookup is <code>gethostbyname()</code>: you pass it a hostname string, and it returns a <code>struct hostent</code> containing the IP address(es) for that host. Our HTTP client uses this function. However, <code>gethostbyname()</code> is considered obsolete because it only supports IPv4 and is not thread-safe (it returns a pointer to a static buffer). The modern replacement is <code>getaddrinfo()</code>, which supports both IPv4 and IPv6, is thread-safe, and can resolve both hostnames and service names (like "http" to port 80) in one call. For new code, always prefer <code>getaddrinfo()</code>.</p>
` },
        { type: 'text', html: `
<h3>Building an HTTP Client in C</h3>
<p>Let's implement a minimal HTTP client from scratch. This is what our text-based browser will use internally:</p>
` },
        { type: 'code', label: 'http_client.c — A complete HTTP/1.1 client', code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

#define MAX_RESPONSE (1024 * 1024)  /* 1 MB max response */

/* Parse a URL into host, port, and path components */
int parse_url(const char *url, char *host, int *port, char *path) {
    *port = 80;  /* default HTTP port */

    /* Skip "http://" prefix if present */
    if (strncmp(url, "http://", 7) == 0)
        url += 7;

    /* Find the path (starts at first '/') */
    const char *slash = strchr(url, '/');
    if (slash) {
        int host_len = slash - url;
        strncpy(host, url, host_len);
        host[host_len] = '\\0';
        strcpy(path, slash);
    } else {
        strcpy(host, url);
        strcpy(path, "/");
    }

    /* Check for port in host (e.g., "example.com:8080") */
    char *colon = strchr(host, ':');
    if (colon) {
        *port = atoi(colon + 1);
        *colon = '\\0';
    }

    return 0;
}

/* Connect to a host:port via TCP and return the socket fd */
int tcp_connect(const char *host, int port) {
    struct hostent *he = gethostbyname(host);
    if (!he) {
        fprintf(stderr, "DNS lookup failed for %s\\n", host);
        return -1;
    }

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) { perror("socket"); return -1; }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port   = htons(port);
    memcpy(&addr.sin_addr, he->h_addr, he->h_length);

    if (connect(sock, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("connect");
        close(sock);
        return -1;
    }

    return sock;
}

/* Send an HTTP GET request and read the response */
char *http_get(const char *url, int *response_len) {
    char host[256], path[1024];
    int port;

    parse_url(url, host, &port, path);
    printf("[http] Connecting to %s:%d ...\\n", host, port);

    int sock = tcp_connect(host, port);
    if (sock < 0) return NULL;

    /* Build HTTP request */
    char request[2048];
    int req_len = snprintf(request, sizeof(request),
        "GET %s HTTP/1.1\\r\\n"
        "Host: %s\\r\\n"
        "User-Agent: MiniBrowser/1.0\\r\\n"
        "Accept: text/html\\r\\n"
        "Connection: close\\r\\n"
        "\\r\\n",
        path, host);

    printf("[http] Sending request:\\n%s", request);

    /* Send request */
    if (write(sock, request, req_len) != req_len) {
        perror("write");
        close(sock);
        return NULL;
    }

    /* Read response */
    char *response = malloc(MAX_RESPONSE);
    if (!response) { close(sock); return NULL; }

    int total = 0;
    ssize_t n;
    while ((n = read(sock, response + total, MAX_RESPONSE - total - 1)) > 0) {
        total += n;
    }
    response[total] = '\\0';
    *response_len = total;

    close(sock);
    printf("[http] Received %d bytes\\n", total);
    return response;
}

/* Parse the HTTP response: split headers and body */
int http_parse_response(const char *response, int *status_code,
                        const char **headers, const char **body)
{
    /* Status line: "HTTP/1.1 200 OK\\r\\n" */
    if (sscanf(response, "HTTP/%*d.%*d %d", status_code) != 1)
        return -1;

    /* Headers end at "\\r\\n\\r\\n" */
    *headers = strchr(response, '\\n');
    if (*headers) (*headers)++;

    *body = strstr(response, "\\r\\n\\r\\n");
    if (*body) {
        *body += 4;  /* skip the "\\r\\n\\r\\n" */
        return 0;
    }

    return -1;
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <url>\\n", argv[0]);
        fprintf(stderr, "Example: %s http://example.com/\\n", argv[0]);
        return 1;
    }

    int response_len;
    char *response = http_get(argv[1], &response_len);
    if (!response) {
        fprintf(stderr, "Request failed\\n");
        return 1;
    }

    int status_code;
    const char *headers, *body;
    if (http_parse_response(response, &status_code, &headers, &body) == 0) {
        printf("\\n=== Status: %d ===\\n\\n", status_code);
        printf("=== Body ===\\n%s\\n", body);
    } else {
        printf("Failed to parse response\\n");
        printf("Raw response:\\n%s\\n", response);
    }

    free(response);
    return 0;
}

/* Compile and run:
 *   gcc -o http_client http_client.c
 *   ./http_client http://example.com/
 *   ./http_client http://httpbin.org/get
 */` },
        { type: 'text', html: `
<h3>Important HTTP Headers</h3>
<p>Headers carry metadata about the request or response. Here are the most important ones:</p>
` },
        { type: 'table', headers: ['Header', 'Direction', 'Purpose'],
          rows: [
            ['<code>Host</code>', 'Request', 'The domain name (required in HTTP/1.1 — allows virtual hosting)'],
            ['<code>Content-Type</code>', 'Both', 'MIME type of the body: text/html, application/json, image/png, etc.'],
            ['<code>Content-Length</code>', 'Both', 'Size of the body in bytes'],
            ['<code>User-Agent</code>', 'Request', 'Identifies the client (browser name and version)'],
            ['<code>Accept</code>', 'Request', 'What content types the client can handle'],
            ['<code>Connection</code>', 'Both', '"close" to end after response, "keep-alive" to reuse the TCP connection'],
            ['<code>Location</code>', 'Response', 'URL to redirect to (used with 301/302 status codes)'],
            ['<code>Transfer-Encoding</code>', 'Response', '"chunked" means body is sent in pieces with size prefixes'],
          ]
        },
        { type: 'text', html: `
<h4>Virtual Hosting and the Host Header</h4>
<p><strong>Virtual hosting</strong> allows a single server (one IP address) to host multiple websites. When a request arrives, the server looks at the <code>Host</code> header to determine which site the client wants. This is why <code>Host</code> is mandatory in HTTP/1.1 — without it, a server at 93.184.216.34 would not know whether you want <code>example.com</code> or <code>example.org</code>, even though both resolve to the same IP. Before HTTP/1.1, every website needed its own IP address, which accelerated the exhaustion of the IPv4 address space.</p>

<h4>MIME Types (Content-Type)</h4>
<p>The <code>Content-Type</code> header uses <strong>MIME types</strong> (Multipurpose Internet Mail Extensions) to describe the format of the body. A MIME type has two parts: a type and a subtype, separated by a slash. Common examples: <code>text/html</code> for web pages, <code>text/plain</code> for plain text, <code>application/json</code> for JSON data, <code>image/png</code> for PNG images. The browser uses the MIME type to decide how to handle the response — render HTML, display an image, download a file, etc. Servers determine the MIME type from the file extension (e.g., <code>.html</code> maps to <code>text/html</code>).</p>

<h4>Chunked Transfer Encoding</h4>
<p>When a server does not know the total size of the response body in advance (for example, when generating content dynamically), it cannot set a <code>Content-Length</code> header. Instead, it uses <code>Transfer-Encoding: chunked</code>, which sends the body in a series of chunks. Each chunk starts with the chunk size in hexadecimal on its own line, followed by a CRLF, then that many bytes of data, followed by another CRLF. The stream ends with a zero-length chunk (<code>0\\r\\n\\r\\n</code>). For example:</p>
` },
        { type: 'diagram', content: `
Chunked Transfer Encoding Format
===================================

  HTTP/1.1 200 OK\\r\\n
  Transfer-Encoding: chunked\\r\\n
  \\r\\n
  1a\\r\\n                          <-- hex size: 26 bytes
  This is the first chunk.\\r\\n   <-- 26 bytes of data
  10\\r\\n                          <-- hex size: 16 bytes
  Second chunk!!!\\r\\n             <-- 16 bytes of data
  0\\r\\n                           <-- zero-length chunk = END
  \\r\\n                            <-- final CRLF

To read chunked data:
  1. Read a line, parse the hex number -> that is the chunk size
  2. Read exactly that many bytes -> that is the chunk data
  3. Read the trailing \\r\\n after the chunk data
  4. If chunk size was 0, the body is complete
  5. Otherwise, go back to step 1` },
        { type: 'info', variant: 'info', title: 'HTTP/1.0 vs HTTP/1.1 vs HTTP/2',
          html: `<p><strong>HTTP/1.0:</strong> One request per TCP connection. Open, request, response, close. Wasteful.</p>
<p><strong>HTTP/1.1:</strong> Added persistent connections (keep-alive), chunked transfer encoding, the Host header (virtual hosting), and more. This is what we implement.</p>
<p><strong>HTTP/2:</strong> Binary protocol (not text), multiplexes many requests over one TCP connection, header compression, server push. Much faster but much more complex.</p>
<p><strong>HTTP/3:</strong> Replaces TCP with QUIC (over UDP) for even better performance.</p>
<p>We implement HTTP/1.1 because it's text-based, easy to understand, and still widely supported.</p>` },
        { type: 'video', id: 'iYM2zFP3Zn0', title: 'HTTP Crash Course and Exploration — Traversy Media' },
        { type: 'video', id: '0OrmKCB0UrQ', title: 'How a DNS lookup works — PowerCert' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Use <code>telnet</code> (or <code>nc</code>) to manually send an HTTP request: <code>printf "GET / HTTP/1.1\\r\\nHost: example.com\\r\\nConnection: close\\r\\n\\r\\n" | nc example.com 80</code>',
          'Build and run the HTTP client. Fetch http://example.com/ and http://httpbin.org/get. Examine the full response including headers.',
          'Add HTTP redirect following: if the response is 301 or 302, read the Location header and make a new request to that URL. Limit to 5 redirects to prevent loops.',
          'Implement HTTP POST: add a function <code>http_post(url, content_type, body)</code> that sends data. Test with httpbin.org/post.',
          'Add chunked transfer encoding support: parse responses where <code>Transfer-Encoding: chunked</code> is present. Each chunk starts with its hex size followed by the data.',
          'Build a simple HTTP server that serves static files from a directory. Accept GET requests, map the path to a file, and return the file contents with the correct Content-Type.',
          'Use Wireshark to capture an HTTP request/response and identify every field: Ethernet header, IP header, TCP header, and HTTP payload.',
        ]},
        { type: 'resources', links: [
          { type: 'RFC', title: 'RFC 7230-7235 — HTTP/1.1 Specification', url: 'https://tools.ietf.org/html/rfc7230', desc: 'The official HTTP/1.1 spec (7230 = message syntax, 7231 = semantics)' },
          { type: 'Tutorial', title: 'MDN: HTTP Overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', desc: "Mozilla's excellent HTTP documentation" },
          { type: 'Tool', title: 'httpbin.org', url: 'https://httpbin.org/', desc: 'A service that echoes back your HTTP requests — perfect for testing' },
          { type: 'Article', title: 'Julia Evans: HTTP zine', url: 'https://wizardzines.com/zines/http/', desc: 'Fun illustrated guide to HTTP concepts' },
        ]},
      ],
    },
    {
      id: 5,
      title: "Building a Text-Based Web Browser",
      subtitle: "The capstone: HTML parsing and terminal rendering",
      duration: "3 hours",
      content: [
        { type: 'text', html: `
<h2>The Capstone: A Browser from Scratch</h2>
<p>This is the moment where everything comes together. We have a TCP/IP stack, an HTTP client, and an understanding of every layer from transistors to application protocols. Now we build the final piece: a <strong>text-based web browser</strong> that fetches a web page and renders it in the terminal.</p>

<p>Our browser will:</p>
<ol>
<li>Accept a URL from the user</li>
<li>Resolve the hostname to an IP address (DNS)</li>
<li>Open a TCP connection to the server</li>
<li>Send an HTTP GET request</li>
<li>Receive and parse the HTTP response</li>
<li>Parse the HTML body</li>
<li>Render readable text to the terminal, handling basic tags</li>
<li>Display links so the user can navigate</li>
</ol>

<h3>Step 1: HTML Parsing Basics</h3>
<p>HTML is a markup language — content interspersed with <strong>tags</strong> that describe structure and formatting. Our parser needs to handle the core tags to produce readable output:</p>
` },
        { type: 'diagram', content: `
HTML Tag Categories We Need to Handle
=======================================

Structure:
  <html>, <head>, <body>         Skip/ignore (structural only)
  <title>                        Show in header bar

Block elements (start new line):
  <h1>...<h6>                    Headings — show in BOLD/CAPS
  <p>                            Paragraph — add blank line before
  <br>, <br/>                    Line break
  <div>                          Division — treat like paragraph
  <li>                           List item — prefix with "  * "
  <ul>, <ol>                     Lists — add spacing

Inline elements (no line break):
  <b>, <strong>                  Bold text (use terminal bold)
  <i>, <em>                      Italic (use terminal underline)
  <a href="...">                 Link — show text, number the link

Ignored:
  <script>...</script>           JavaScript — skip entirely
  <style>...</style>             CSS — skip entirely
  <head>...</head>               Metadata — skip (except <title>)
  <!-- ... -->                   Comments — skip

Our parser strategy:
  1. Scan character by character
  2. When we see '<', switch to tag-reading mode
  3. Parse the tag name and any attributes
  4. Apply formatting based on tag type
  5. When we see '>', switch back to text mode
  6. Collect text content and output with formatting` },
        { type: 'text', html: `
<h3>Architecture of the HTML Parser</h3>
<p>Our parser is a single-pass, character-by-character state machine. As it scans the HTML input, it is always in one of three modes:</p>

<p><strong>Text mode</strong> is the default. The parser reads printable characters and emits them to the terminal. Whitespace is collapsed: multiple spaces, tabs, and newlines in the HTML source are reduced to a single space in the output (just like a real browser). This continues until the parser sees <code>&lt;</code> (which switches to tag mode) or <code>&amp;</code> (which switches to entity mode). The <code>skip</code> flag in the render state suppresses output when we are inside <code>&lt;script&gt;</code> or <code>&lt;style&gt;</code> blocks.</p>

<p><strong>Tag mode</strong> activates when the parser encounters a <code>&lt;</code> character. It reads everything up to the closing <code>&gt;</code> into a buffer, then passes the tag content to the <code>process_tag()</code> function. This function extracts the tag name (converting to lowercase for case-insensitive matching), checks whether it is an opening or closing tag (by looking for a leading <code>/</code>), and dispatches based on the tag name. Block elements like <code>&lt;p&gt;</code>, <code>&lt;div&gt;</code>, and headings call <code>block_break()</code> to insert a blank line. Inline elements like <code>&lt;b&gt;</code> and <code>&lt;i&gt;</code> toggle terminal formatting codes. The <code>&lt;a&gt;</code> tag extracts the <code>href</code> attribute, tracks the link text, and assigns a link number. The distinction between block and inline is the same as in CSS: block elements start on a new line, inline elements flow within the current line.</p>

<p><strong>Entity mode</strong> activates when the parser encounters an <code>&amp;</code> character. HTML entities are sequences like <code>&amp;amp;</code>, <code>&amp;lt;</code>, and <code>&amp;quot;</code> that represent characters which have special meaning in HTML (see below). The <code>decode_entity()</code> function checks for known entities and returns the decoded character. If the entity is not recognized, the literal <code>&amp;</code> is emitted.</p>

<p>The <code>render_state</code> struct tracks everything the parser needs to know about its current context: the column position (for word wrapping at <code>TERM_WIDTH</code>), which formatting flags are active (bold, italic, link), whether we are in a skipped region, and buffers for collecting the page title and link text. This design keeps the parser stateless across characters — all state is explicit in the struct.</p>
` },
        { type: 'text', html: `
<h3>ANSI Terminal Escape Codes</h3>
<p>Our browser renders formatted text using <strong>ANSI escape codes</strong> — special byte sequences that terminals interpret as formatting instructions rather than displayable characters. Every escape sequence starts with <code>ESC[</code> (hex <code>0x1B5B</code>, or in C string notation <code>\\\\033[</code>), followed by a numeric code and a letter. For example, <code>\\\\033[1m</code> turns on bold text: the terminal reads the escape byte (0x1B), the opening bracket, the number 1 (which means "bold"), and the letter <code>m</code> (which means "set graphics mode"). All text printed after that will appear bold until a reset code is sent.</p>

<p>The codes used in our browser are: <code>\\\\033[1m</code> for bold on, <code>\\\\033[22m</code> for bold off, <code>\\\\033[4m</code> for underline on (used for italic text, since most terminals do not support true italics), <code>\\\\033[24m</code> for underline off, <code>\\\\033[36m</code> for cyan foreground color (used for links), and <code>\\\\033[0m</code> to reset all formatting to defaults. These codes work in virtually all modern terminal emulators (xterm, iTerm2, GNOME Terminal, Windows Terminal). The terminal intercepts these byte sequences before rendering — they consume no visible column space on screen.</p>
` },
        { type: 'text', html: `
<h3>HTML Entities</h3>
<p>HTML uses certain characters as markup syntax — <code>&lt;</code> starts a tag, <code>&gt;</code> ends a tag, <code>&amp;</code> begins an entity reference, and <code>&quot;</code> delimits attribute values. When you need these characters to appear as literal text in a web page, you must <strong>escape</strong> them using HTML entities: <code>&amp;lt;</code> for &lt;, <code>&amp;gt;</code> for &gt;, <code>&amp;amp;</code> for &amp;, and <code>&amp;quot;</code> for &quot;. There are also entities for non-keyboard characters like <code>&amp;nbsp;</code> (non-breaking space) and <code>&amp;copy;</code> (copyright symbol). Our parser handles the five most common entities; a full browser would decode hundreds of named entities plus numeric references like <code>&amp;#169;</code>.</p>
` },
        { type: 'code', label: 'html_parser.c — A minimal HTML parser and renderer', code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_LINKS   256
#define MAX_TAG_LEN 64
#define TERM_WIDTH  80

/* Terminal escape codes for formatting */
#define BOLD_ON    "\\033[1m"
#define BOLD_OFF   "\\033[22m"
#define ULINE_ON   "\\033[4m"
#define ULINE_OFF  "\\033[24m"
#define CYAN       "\\033[36m"
#define RESET      "\\033[0m"

/* Collected links */
struct link {
    char url[512];
    char text[256];
};

static struct link links[MAX_LINKS];
static int link_count = 0;

/* Current rendering state */
struct render_state {
    int col;             /* current column position                */
    int bold;            /* inside <b> or <strong>?                */
    int italic;          /* inside <i> or <em>?                    */
    int in_link;         /* inside <a>?                            */
    int in_title;        /* inside <title>?                        */
    int skip;            /* inside <script> or <style>? skip text  */
    int in_list;         /* inside <ul> or <ol>?                   */
    int last_was_block;  /* did we just output a block break?      */
    char title[256];     /* page title                             */
    int title_pos;       /* position in title buffer               */
    char link_text[256]; /* text inside current <a> tag            */
    int link_text_pos;
};

/* Output a character, wrapping at terminal width */
static void emit_char(struct render_state *s, char c) {
    if (c == '\\n') {
        putchar('\\n');
        s->col = 0;
        return;
    }
    if (s->col >= TERM_WIDTH) {
        putchar('\\n');
        s->col = 0;
    }
    putchar(c);
    s->col++;
}

/* Output a string */
static void emit_str(struct render_state *s, const char *str) {
    while (*str) emit_char(s, *str++);
}

/* Ensure we're at the start of a new line */
static void ensure_newline(struct render_state *s) {
    if (s->col > 0) {
        putchar('\\n');
        s->col = 0;
    }
}

/* Add a blank line (paragraph break) */
static void block_break(struct render_state *s) {
    if (!s->last_was_block) {
        ensure_newline(s);
        putchar('\\n');
        s->last_was_block = 1;
    }
}

/* Decode basic HTML entities */
static char decode_entity(const char **p) {
    if (strncmp(*p, "&amp;", 5) == 0)  { *p += 5; return '&'; }
    if (strncmp(*p, "&lt;", 4) == 0)   { *p += 4; return '<'; }
    if (strncmp(*p, "&gt;", 4) == 0)   { *p += 4; return '>'; }
    if (strncmp(*p, "&quot;", 6) == 0)  { *p += 6; return '"'; }
    if (strncmp(*p, "&nbsp;", 6) == 0)  { *p += 6; return ' '; }
    if (strncmp(*p, "&#39;", 5) == 0)   { *p += 5; return '\\''; }
    return 0;  /* unknown entity */
}

/* Extract href attribute from an <a> tag */
static void extract_href(const char *tag_content, char *href, int max_len) {
    href[0] = '\\0';
    const char *p = strstr(tag_content, "href=");
    if (!p) return;
    p += 5;

    char quote = 0;
    if (*p == '"' || *p == '\\'') {
        quote = *p++;
    }

    int i = 0;
    while (*p && *p != quote && *p != '>' && *p != ' ' && i < max_len - 1) {
        href[i++] = *p++;
    }
    href[i] = '\\0';
}

/* Process an HTML tag */
static void process_tag(struct render_state *s, const char *tag) {
    /* Normalize: lowercase tag name */
    char name[MAX_TAG_LEN];
    int closing = 0;
    const char *p = tag;

    if (*p == '/') { closing = 1; p++; }

    int i = 0;
    while (*p && *p != ' ' && *p != '>' && *p != '/' && i < MAX_TAG_LEN - 1) {
        name[i++] = tolower(*p++);
    }
    name[i] = '\\0';

    /* Block elements */
    if (strcmp(name, "p") == 0 || strcmp(name, "div") == 0) {
        block_break(s);
    }
    else if (name[0] == 'h' && name[1] >= '1' && name[1] <= '6' && name[2] == '\\0') {
        if (!closing) {
            block_break(s);
            printf("%s", BOLD_ON);
        } else {
            printf("%s", BOLD_OFF);
            ensure_newline(s);
        }
    }
    else if (strcmp(name, "br") == 0) {
        ensure_newline(s);
    }
    else if (strcmp(name, "li") == 0 && !closing) {
        ensure_newline(s);
        emit_str(s, "  * ");
        s->last_was_block = 0;
    }
    else if (strcmp(name, "ul") == 0 || strcmp(name, "ol") == 0) {
        if (!closing) { block_break(s); s->in_list = 1; }
        else { s->in_list = 0; ensure_newline(s); }
    }
    /* Inline formatting */
    else if (strcmp(name, "b") == 0 || strcmp(name, "strong") == 0) {
        printf("%s", closing ? BOLD_OFF : BOLD_ON);
        s->bold = !closing;
    }
    else if (strcmp(name, "i") == 0 || strcmp(name, "em") == 0) {
        printf("%s", closing ? ULINE_OFF : ULINE_ON);
        s->italic = !closing;
    }
    /* Links */
    else if (strcmp(name, "a") == 0) {
        if (!closing) {
            s->in_link = 1;
            s->link_text_pos = 0;
            s->link_text[0] = '\\0';
            if (link_count < MAX_LINKS) {
                extract_href(tag, links[link_count].url,
                             sizeof(links[link_count].url));
            }
            printf("%s%s", CYAN, ULINE_ON);
        } else {
            printf("%s[%d]%s", BOLD_ON, link_count, RESET);
            s->link_text[s->link_text_pos] = '\\0';
            if (link_count < MAX_LINKS) {
                strncpy(links[link_count].text, s->link_text,
                        sizeof(links[link_count].text));
                link_count++;
            }
            s->in_link = 0;
        }
    }
    /* Sections to skip */
    else if (strcmp(name, "script") == 0 || strcmp(name, "style") == 0) {
        s->skip = !closing;
    }
    else if (strcmp(name, "title") == 0) {
        if (!closing) { s->in_title = 1; s->title_pos = 0; }
        else { s->in_title = 0; s->title[s->title_pos] = '\\0'; }
    }
    else if (strcmp(name, "head") == 0 && !closing) {
        s->skip = 1;
    }
    else if (strcmp(name, "body") == 0 && !closing) {
        s->skip = 0;
    }

    if (!closing && (strcmp(name, "p") == 0 || strcmp(name, "div") == 0))
        s->last_was_block = 0;
}

/* Main HTML parser and renderer */
void html_render(const char *html) {
    struct render_state state = {0};
    const char *p = html;

    while (*p) {
        if (*p == '<') {
            /* --- TAG MODE --- */
            p++;

            /* Handle HTML comments: <!-- ... --> */
            if (p[0] == '!' && p[1] == '-' && p[2] == '-') {
                const char *end = strstr(p, "-->");
                if (end) { p = end + 3; continue; }
            }

            /* Read tag content */
            char tag[1024];
            int ti = 0;
            while (*p && *p != '>' && ti < (int)sizeof(tag) - 1) {
                tag[ti++] = *p++;
            }
            tag[ti] = '\\0';
            if (*p == '>') p++;

            process_tag(&state, tag);
        }
        else if (*p == '&') {
            /* --- HTML ENTITY --- */
            char decoded = decode_entity(&p);
            if (decoded) {
                if (!state.skip) emit_char(&state, decoded);
            } else {
                if (!state.skip) emit_char(&state, '&');
                p++;
            }
        }
        else {
            /* --- TEXT MODE --- */
            if (state.skip) { p++; continue; }

            if (state.in_title && state.title_pos < (int)sizeof(state.title) - 1) {
                state.title[state.title_pos++] = *p;
            }

            if (state.in_link && state.link_text_pos < (int)sizeof(state.link_text) - 1) {
                state.link_text[state.link_text_pos++] = *p;
            }

            /* Collapse whitespace */
            if (isspace((unsigned char)*p)) {
                if (state.col > 0)
                    emit_char(&state, ' ');
                while (*p && isspace((unsigned char)*p)) p++;
                state.last_was_block = 0;
            } else {
                emit_char(&state, *p);
                state.last_was_block = 0;
                p++;
            }
        }
    }

    /* Print collected links */
    if (link_count > 0) {
        printf("\\n\\n%s--- Links ---%s\\n", BOLD_ON, BOLD_OFF);
        for (int i = 0; i < link_count; i++) {
            printf("  [%d] %s\\n       %s\\n", i, links[i].text, links[i].url);
        }
    }

    printf("%s\\n", RESET);
}` },
        { type: 'text', html: `
<h3>Step 2: Putting It All Together — The Browser</h3>
<p>Now we combine the HTTP client with the HTML parser to create our browser. It accepts URLs, fetches pages, renders them, and lets you follow links:</p>
` },
        { type: 'code', label: 'browser.c — The complete text-based web browser', code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Include our HTTP client and HTML parser (or link their .o files) */
extern char *http_get(const char *url, int *response_len);
extern int   http_parse_response(const char *response, int *status_code,
                                 const char **headers, const char **body);
extern void  html_render(const char *html);
extern struct link { char url[512]; char text[256]; } links[];
extern int   link_count;

#define MAX_URL 2048

/* Resolve a possibly-relative URL against a base URL */
void resolve_url(const char *base, const char *href, char *out, int max) {
    if (strncmp(href, "http://", 7) == 0 || strncmp(href, "https://", 8) == 0) {
        /* Absolute URL — use as-is */
        strncpy(out, href, max);
        return;
    }

    /* Relative URL — combine with base */
    char base_host[256] = {0};
    const char *p = base;
    if (strncmp(p, "http://", 7) == 0) p += 7;

    /* Extract scheme + host */
    if (href[0] == '/') {
        /* Absolute path — append to scheme + host */
        const char *slash = strchr(p, '/');
        int host_len = slash ? (int)(slash - base) : (int)strlen(base);
        snprintf(out, max, "%.*s%s", host_len, base, href);
    } else {
        /* Relative path — append to base directory */
        const char *last_slash = strrchr(base, '/');
        int base_len = last_slash ? (int)(last_slash - base + 1) : (int)strlen(base);
        snprintf(out, max, "%.*s%s", base_len, base, href);
    }
}

int main(int argc, char *argv[]) {
    char current_url[MAX_URL];
    char input[256];

    if (argc >= 2) {
        strncpy(current_url, argv[1], MAX_URL);
    } else {
        strcpy(current_url, "http://example.com/");
    }

    printf("========================================\\n");
    printf("  MiniBrowser 1.0 — Text Web Browser    \\n");
    printf("  Type a URL, link number, or 'q' to quit\\n");
    printf("========================================\\n\\n");

    while (1) {
        /* Reset link list */
        link_count = 0;

        /* Fetch the page */
        printf("\\033[1mLoading: %s\\033[0m\\n\\n", current_url);

        int response_len;
        char *response = http_get(current_url, &response_len);
        if (!response) {
            fprintf(stderr, "Failed to fetch %s\\n", current_url);
            goto prompt;
        }

        /* Parse HTTP response */
        int status_code;
        const char *headers, *body;
        if (http_parse_response(response, &status_code, &headers, &body) != 0) {
            fprintf(stderr, "Failed to parse HTTP response\\n");
            free(response);
            goto prompt;
        }

        /* Handle redirects */
        if (status_code == 301 || status_code == 302) {
            const char *loc = strstr(headers, "Location: ");
            if (!loc) loc = strstr(headers, "location: ");
            if (loc) {
                loc += 10;
                char new_url[MAX_URL];
                int i = 0;
                while (*loc && *loc != '\\r' && *loc != '\\n' && i < MAX_URL - 1)
                    new_url[i++] = *loc++;
                new_url[i] = '\\0';

                resolve_url(current_url, new_url, current_url, MAX_URL);
                printf("Redirecting to: %s\\n\\n", current_url);
                free(response);
                continue;
            }
        }

        if (status_code != 200) {
            printf("HTTP Error: %d\\n", status_code);
        }

        /* Render HTML */
        printf("--- Page Content ---\\n\\n");
        html_render(body);
        free(response);

    prompt:
        printf("\\n\\033[1m[URL/link#/q]>\\033[0m ");
        fflush(stdout);

        if (!fgets(input, sizeof(input), stdin))
            break;

        /* Strip newline */
        input[strcspn(input, "\\n")] = '\\0';

        if (strcmp(input, "q") == 0 || strcmp(input, "quit") == 0)
            break;

        if (input[0] == '\\0')
            continue;

        /* Check if it's a link number */
        char *endptr;
        long num = strtol(input, &endptr, 10);
        if (*endptr == '\\0' && num >= 0 && num < link_count) {
            resolve_url(current_url, links[num].url, current_url, MAX_URL);
        } else if (strncmp(input, "http", 4) == 0) {
            strncpy(current_url, input, MAX_URL);
        } else {
            printf("Enter a URL (http://...), a link number, or 'q' to quit.\\n");
        }
    }

    printf("\\nGoodbye!\\n");
    return 0;
}` },
        { type: 'code', label: 'Makefile — Building the complete browser', code: `# Makefile for MiniBrowser

CC      = gcc
CFLAGS  = -Wall -Wextra -O2
LDFLAGS =

SRCS    = browser.c http_client.c html_parser.c
OBJS    = $(SRCS:.c=.o)
TARGET  = minibrowser

all: $(TARGET)

$(TARGET): $(OBJS)
\t$(CC) $(CFLAGS) -o $@ $(OBJS) $(LDFLAGS)

%.o: %.c
\t$(CC) $(CFLAGS) -c -o $@ $<

clean:
\trm -f $(OBJS) $(TARGET)

# Quick test
test: $(TARGET)
\t./$(TARGET) http://example.com/

.PHONY: all clean test` },
        { type: 'text', html: `
<h3>Example Session</h3>
<p>Here's what it looks like when you run the browser:</p>
` },
        { type: 'diagram', content: `
MiniBrowser Example Session
============================

$ ./minibrowser http://example.com/
========================================
  MiniBrowser 1.0 -- Text Web Browser
  Type a URL, link number, or 'q' to quit
========================================

Loading: http://example.com/

[http] Connecting to example.com:80 ...
[http] Received 1256 bytes

--- Page Content ---

Example Domain

This domain is for use in illustrative examples in documents. You may
use this domain in literature without prior coordination or asking for
permission.

More information...[0]

--- Links ---
  [0] More information...
       https://www.iana.org/domains/example

[URL/link#/q]> 0

Loading: https://www.iana.org/domains/example
...` },
        { type: 'text', html: `
<h3>Architecture of Our Browser</h3>
<p>Let's step back and appreciate the full stack we've built. Every layer maps to what we learned throughout the course:</p>
` },
        { type: 'diagram', content: `
The Complete Stack We Built
============================

  +-----------------------------------------------+
  |           MiniBrowser (Application)            |  <- YOU ARE HERE
  |  - URL input, link navigation, terminal UI    |
  +-----------------------------------------------+
  |           HTML Parser & Renderer               |  <- Lesson 5
  |  - Tag parsing, entity decoding, text output   |
  +-----------------------------------------------+
  |              HTTP Client                       |  <- Lesson 4
  |  - Request building, response parsing          |
  +-----------------------------------------------+
  |              DNS Resolution                    |
  |  - gethostbyname() -> IP address               |
  +-----------------------------------------------+
  |              TCP (Transport)                   |  <- Lesson 1
  |  - 3-way handshake, reliable byte stream       |
  |  - Sequence numbers, ACKs, flow control        |
  +-----------------------------------------------+
  |              IP (Network)                      |  <- Lesson 1
  |  - Addressing, routing, packet construction    |
  +-----------------------------------------------+
  |           Ethernet / Link Layer                |
  |  - MAC addresses, ARP, frame construction      |
  +-----------------------------------------------+
  |           Physical Layer                       |  <- Section 1
  |  - Transistors, gates, signals on wire         |
  +-----------------------------------------------+

  From Section 1 (transistors) to Section 6 (web browser),
  you now understand every layer of the computing stack.

  This is what "From the Transistor" means.` },
        { type: 'info', variant: 'warning', title: 'HTTP-Only Limitation',
          html: `<p>Our browser only supports plain HTTP — it cannot fetch HTTPS URLs, and the vast majority of websites today require HTTPS. If you try to load an HTTPS site, the connection will fail or return garbage because our client sends plaintext to a port expecting a TLS handshake. For testing and development, the easiest workaround is to run a local HTTP server. Python makes this trivial:</p>
<p><code>python3 -m http.server 8080</code></p>
<p>This serves files from the current directory on <code>http://localhost:8080</code>. Create some HTML files and point MiniBrowser at them: <code>./minibrowser http://localhost:8080/test.html</code>. You can also fetch <code>http://example.com/</code> — it is one of the few sites that still accepts plain HTTP. Adding HTTPS support requires integrating a TLS library like OpenSSL or mbedTLS, which is a significant but worthwhile exercise listed below.</p>` },
        { type: 'info', variant: 'tip', title: 'Extending the Browser',
          html: `<p>Our browser is minimal but fully functional. Here are ways to extend it for deeper learning:</p>
<ul>
<li><strong>HTTPS support:</strong> Add TLS using OpenSSL or mbedTLS. This is the biggest real-world gap — almost all modern sites require HTTPS.</li>
<li><strong>Cookie support:</strong> Store and send cookies for session management.</li>
<li><strong>Form submission:</strong> Parse &lt;form&gt; tags and support POST requests.</li>
<li><strong>Image descriptions:</strong> Show &lt;img alt="..."&gt; text in place of images.</li>
<li><strong>History:</strong> Add back/forward navigation with a URL stack.</li>
<li><strong>Bookmarks:</strong> Save and load favorite URLs from a file.</li>
<li><strong>Caching:</strong> Store fetched pages locally, respect Cache-Control headers.</li>
</ul>` },
        { type: 'video', id: 'brhuVn91EdY', title: 'How Browsers Work — JSConf EU' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Build and run the complete MiniBrowser. Fetch http://example.com/ and navigate using link numbers.',
          'Add support for the <code>&lt;pre&gt;</code> tag: preserve whitespace and newlines inside preformatted blocks instead of collapsing them.',
          'Add <code>&lt;table&gt;</code> rendering: show table data in aligned columns using fixed-width formatting.',
          'Implement a history feature: pressing "b" goes back to the previous page. Use a stack (array + index) to track visited URLs.',
          'Add HTTPS support using OpenSSL: replace the raw TCP connection with <code>SSL_connect()</code> for https:// URLs. This is a major but worthwhile exercise.',
          'Implement HTTP/1.1 keep-alive: reuse the same TCP connection for multiple requests to the same host instead of reconnecting each time.',
          'Build a "save page" feature: press "s" to save the current page HTML to a local file.',
          'Add color themes: render <code>&lt;h1&gt;</code> in one color, links in another, regular text in white. Let the user switch themes.',
          'Stress test the parser with complex real-world HTML: try news sites, Wikipedia, etc. Fix any crashes or rendering issues you find.',
          'Write a companion web server that serves pages your browser can render. Test the full client-server loop on localhost.',
        ]},
        { type: 'resources', links: [
          { type: 'Project', title: 'Lynx — The classic text-mode browser', url: 'https://lynx.browser.org/', desc: 'The original text-based browser — see how the pros did it' },
          { type: 'Book', title: 'Web Browser Engineering by Pavel Panchekha', url: 'https://browser.engineering/', desc: 'Free online book: build a browser from scratch in Python' },
          { type: 'Tutorial', title: "Let's Build a Browser Engine (Matt Brubeck)", url: 'https://limpet.net/mbrubeck/2014/08/08/toy-layout-engine-1.html', desc: 'Series on building an HTML rendering engine in Rust' },
          { type: 'Video', title: 'Ryan Dahl — Original Node.js Presentation', url: 'https://www.youtube.com/watch?v=ztspvPYybIY', desc: 'How HTTP and networking drove the design of Node.js — connects this section to modern web development' },
          { type: 'Article', title: 'How Browsers Work (Tali Garsiel)', url: 'https://web.dev/howbrowserswork/', desc: 'Comprehensive deep dive into browser internals' },
        ]},
      ],
    },
  ],
};
