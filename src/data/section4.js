export const section4 = {
  id: 4,
  title: "Compiler: A High-Level Language",
  subtitle: "C Compiler, Linker, and Networking Hardware",
  duration: "3 weeks",
  description: "Write a C compiler in Haskell, build a linker in Python, implement malloc, and design an Ethernet controller in Verilog. By the end you can write programs in C that run on your custom CPU.",
  longDescription: "Assembly is powerful but tedious for large programs. In this section you build the entire toolchain needed to write software in C for your custom CPU: a compiler that translates C to ARM assembly, a linker that combines object files into executables, and a minimal C standard library including malloc. You also expand your hardware with an Ethernet controller, setting the stage for networking.",
  topics: ["C Compiler", "Lexing", "Parsing", "AST", "Code Generation", "Linker", "ELF", "malloc", "libc", "Ethernet MAC", "UDP", "Network Boot"],
  learningGoals: [
    "Understand the complete compilation pipeline: source code to executable",
    "Implement a lexer that tokenizes C source code",
    "Build a recursive descent parser that produces an AST",
    "Generate ARM assembly from an AST (expressions, control flow, functions)",
    "Understand the ELF file format and symbol resolution",
    "Write a linker that combines object files",
    "Implement malloc/free using a free list allocator",
    "Implement core libc functions (memcpy, strlen, printf)",
    "Design an Ethernet MAC controller in Verilog",
    "Implement UDP networking and boot programs over Ethernet",
  ],
  lessons: [
    {
      id: 1,
      title: "How Compilers Work",
      subtitle: "The journey from source code to machine code",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>What Is a Compiler?</h2>
<p>A <strong>compiler</strong> is a program that translates code written in one language (the <em>source language</em>) into another language (the <em>target language</em>). For us, that means translating C into ARM assembly, which our assembler then converts to machine code that runs on our CPU.</p>

<p>This is fundamentally different from an <strong>interpreter</strong>, which executes source code directly without producing a separate binary. Python is typically interpreted; C is typically compiled.</p>

<h3>The Compilation Pipeline</h3>
<p>A compiler works in distinct phases, each transforming the program into a different representation:</p>
` },
        { type: 'diagram', content: `
The Compilation Pipeline:

  Source Code (text)
       |
       v
  ┌─────────────┐
  │   LEXER      │  "int x = 42;"  -->  [INT, ID("x"), EQUALS, NUM(42), SEMI]
  │ (Tokenizer)  │
  └──────┬───────┘
         |  Token Stream
         v
  ┌─────────────┐
  │   PARSER     │  Tokens  -->  Abstract Syntax Tree (AST)
  │              │
  └──────┬───────┘
         |  AST
         v
  ┌─────────────┐
  │  SEMANTIC    │  Type checking, scope resolution, etc.
  │  ANALYSIS    │
  └──────┬───────┘
         |  Annotated AST
         v
  ┌─────────────┐
  │    CODE      │  AST  -->  ARM Assembly
  │  GENERATOR   │
  └──────┬───────┘
         |  Assembly Text
         v
  ┌─────────────┐
  │  ASSEMBLER   │  Assembly  -->  Machine Code (binary)
  │  (from S3)   │
  └──────┬───────┘
         |  Object File (.o)
         v
  ┌─────────────┐
  │   LINKER     │  Object Files  -->  Executable Binary
  │              │
  └─────────────┘` },
        { type: 'text', html: `
<h3>Phase 1: Lexical Analysis (Lexing)</h3>
<p>The lexer (also called tokenizer or scanner) reads raw source text character by character and groups them into <strong>tokens</strong> — the "words" of the programming language. It strips whitespace and comments.</p>
` },
        { type: 'code', label: 'Example: Lexing C code', code: `// Input source code:
int main() {
    int x = 10 + 20;
    return x;
}

// Output token stream:
[
  Token(INT_KW,    "int"),
  Token(IDENT,     "main"),
  Token(LPAREN,    "("),
  Token(RPAREN,    ")"),
  Token(LBRACE,    "{"),
  Token(INT_KW,    "int"),
  Token(IDENT,     "x"),
  Token(ASSIGN,    "="),
  Token(INT_LIT,   "10"),
  Token(PLUS,      "+"),
  Token(INT_LIT,   "20"),
  Token(SEMICOLON, ";"),
  Token(RETURN_KW, "return"),
  Token(IDENT,     "x"),
  Token(SEMICOLON, ";"),
  Token(RBRACE,    "}"),
]` },
        { type: 'text', html: `
<h3>Phase 2: Parsing</h3>
<p>The parser reads the token stream and builds an <strong>Abstract Syntax Tree (AST)</strong> — a tree representation of the program's structure. The parser enforces the grammar rules of the language (e.g., every <code>if</code> must have a condition in parentheses).</p>
` },
        { type: 'diagram', content: `
AST for: int x = 10 + 20;

        VarDecl
       /   |   \\
    type  name  init
     |     |      |
   "int"  "x"   BinOp(+)
                /       \\
           IntLit(10)  IntLit(20)


AST for: if (x > 5) { return x; } else { return 0; }

              IfStmt
            /   |   \\
         cond  then  else
          |     |     |
      BinOp(>) Block  Block
       / \\      |      |
    "x"   5  Return  Return
              |        |
            "x"       0` },
        { type: 'text', html: `
<h3>Phase 3: Semantic Analysis</h3>
<p>The semantic analyzer walks the AST and checks for meaning errors that syntax alone can't catch:</p>
<ul>
<li><strong>Type checking:</strong> Can you add an int and a pointer? Can you assign a string to an int?</li>
<li><strong>Scope resolution:</strong> Is variable <code>x</code> defined in this scope?</li>
<li><strong>Function signatures:</strong> Does the function call match the declaration?</li>
</ul>
<p>For our simplified C compiler, we can keep this phase minimal. But even a minimal semantic pass needs a <strong>symbol table</strong> — a data structure that tracks which names are visible at each point in the program.</p>

<h4>Symbol Table with Nested Scopes</h4>
<p>The symbol table is organized as a stack of scopes. Entering a block (<code>{</code>) pushes a new scope; leaving (<code>}</code>) pops it. A name lookup walks from the innermost scope outward, so inner declarations <strong>shadow</strong> outer ones:</p>
<pre><code>// Given this C code:
int x = 1;                  // global scope
int foo(int x) {            // foo scope: parameter x shadows global x
    int y = x + 1;
    if (y > 0) {
        int z = y + x;      // if-scope: sees y and x from foo scope
        return z;
    }
    return y;
}

// Symbol table at the point &quot;int z = y + x;&quot;:
//
//   Scope 2 (if-block):
//     z  -&gt;  { type: int, kind: local, offset: -16 }
//
//   Scope 1 (foo body):
//     x  -&gt;  { type: int, kind: param, offset: -4  }
//     y  -&gt;  { type: int, kind: local, offset: -8  }
//
//   Scope 0 (global):
//     x  -&gt;  { type: int, kind: global, addr: 0x10000 }
//     foo -&gt; { type: int(int), kind: function }
//
// Looking up &quot;x&quot; starts at scope 2 (not found),
// then scope 1 — found! Parameter x shadows the global x.</code></pre>

<h4>The Maximal Munch Rule</h4>
<p>One subtlety in lexing: when the lexer sees the characters <code>x---y</code>, how should it tokenize them? There are two possibilities:</p>
<ul>
<li><code>x</code> <code>--</code> <code>-</code> <code>y</code> which means <code>(x--) - y</code> (post-decrement x, then subtract y)</li>
<li><code>x</code> <code>-</code> <code>--</code> <code>y</code> which means <code>x - (--y)</code> (subtract pre-decremented y from x)</li>
</ul>
<p>C resolves this with the <strong>maximal munch</strong> (or longest match) rule: the lexer always takes the longest possible token at each step. Reading left to right from <code>---</code>, the longest match starting at the first <code>-</code> is <code>--</code> (the decrement operator). The remaining <code>-</code> becomes a minus operator. So <code>x---y</code> is tokenized as <code>x</code> <code>--</code> <code>-</code> <code>y</code>, meaning <code>(x--) - y</code>.</p>
<p>This is why the lexer must try multi-character operators like <code>--</code>, <code>==</code>, <code>&lt;&lt;</code>, <code>-&gt;</code> <em>before</em> single-character operators like <code>-</code>, <code>=</code>, <code>&lt;</code>. Our TOKEN_SPEC list in Lesson 2 puts longer patterns first for exactly this reason.</p>

<h3>Phase 4: Code Generation</h3>
<p>The code generator walks the AST and emits target language code (ARM assembly for us). For each AST node type, it knows the corresponding assembly pattern:</p>
` },
        { type: 'code', label: 'Code generation: C to ARM assembly', code: `// C source:
int add(int a, int b) {
    return a + b;
}

// Generated ARM assembly:
add:
    PUSH  {LR}          ; Save return address
    ADD   R0, R0, R1    ; R0 = a + b (args in R0, R1 per AAPCS)
    POP   {PC}          ; Return` },
        { type: 'text', html: `
<h3>Key Decisions for Our Compiler</h3>
<p>To keep the project manageable, we'll support a <strong>subset of C</strong>:</p>
` },
        { type: 'table', headers: ['Supported', 'Not Supported'],
          rows: [
            ['int, char, void types', 'float, double, long long'],
            ['Pointers and arrays', 'Multi-dimensional arrays'],
            ['Structs', 'Unions, enums, typedef'],
            ['if/else, while, for, return', 'switch, goto, do-while'],
            ['Functions with up to 4 args', 'Variadic functions (...)'],
            ['Global and local variables', 'Static, extern, volatile'],
            ['Basic preprocessor (#define, #include)', 'Full preprocessor'],
          ]
        },
        { type: 'info', variant: 'tip', title: 'Incremental Development',
          html: '<p>Build your compiler incrementally. Start by compiling programs that just return a number (<code>int main() { return 42; }</code>). Then add arithmetic, then variables, then if/else, then loops, then functions, then pointers. Each step is a small, testable increment.</p>' },
        { type: 'video', id: 'Qkwj65l_96I', title: 'Compilers — Computerphile' },
        { type: 'video', id: 'wSdV1M7n4gQ', title: 'Crafting Interpreters — Introduction' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Draw the AST for: <code>int result = (a + b) * (c - d);</code>',
          'List all the token types you would need for a subset of C (keywords, operators, punctuation, literals, identifiers)',
          'Write pseudocode for a lexer that handles: identifiers, integer literals, +, -, *, /, =, ==, ;, {, }, (, )',
          'Explain why <code>x---y</code> is ambiguous and how the "maximal munch" rule resolves it',
          'Research and compare: recursive descent parsing vs LR parsing vs PEG parsing. Which is simplest to implement?',
        ]},
        { type: 'resources', links: [
          { type: 'Book', title: 'Crafting Interpreters', url: 'https://craftinginterpreters.com/', desc: 'The best free book on building languages — covers lexing, parsing, and code generation' },
          { type: 'Tutorial', title: 'Writing a C Compiler (Nora Sandler)', url: 'https://norasandler.com/2017/11/29/Write-a-Compiler.html', desc: 'Step-by-step C compiler tutorial — the perfect guide for this section' },
          { type: 'Book', title: 'Write You a Haskell (Stephen Diehl)', url: 'https://smunix.github.io/dev.stephendiehl.com/fun/', desc: 'Implementing languages in Haskell' },
          { type: 'Project', title: 'chibicc — A Small C Compiler', url: 'https://github.com/rui314/chibicc', desc: 'Tiny, readable C compiler in C — excellent reference' },
          { type: 'Tutorial', title: 'A Compiler Writing Journey (DoctorWkt)', url: 'https://github.com/DoctorWkt/acwj', desc: '60+ steps from nothing to a self-compiling C compiler' },
        ]},
      ],
    },
    {
      id: 2,
      title: "Lexing, Parsing, and ASTs",
      subtitle: "Building the front end of a compiler from scratch",
      duration: "2 hrs",
      content: [
        { type: 'text', html: `
<h2>Building a Lexer</h2>
<p>The lexer is the first phase. It reads characters and produces tokens. Each token has a <strong>type</strong> and a <strong>value</strong>. The lexer is essentially a state machine that classifies character sequences.</p>

<h3>Token Types for C</h3>
` },
        { type: 'table', headers: ['Category', 'Token Types', 'Examples'],
          rows: [
            ['Keywords', 'INT, CHAR, VOID, IF, ELSE, WHILE, FOR, RETURN', '<code>int</code>, <code>return</code>'],
            ['Identifiers', 'IDENT', '<code>main</code>, <code>x</code>, <code>myFunc</code>'],
            ['Literals', 'INT_LIT, CHAR_LIT, STRING_LIT', '<code>42</code>, <code>\'a\'</code>, <code>"hello"</code>'],
            ['Operators', 'PLUS, MINUS, STAR, SLASH, EQ, NEQ, LT, GT, ...', '<code>+</code>, <code>==</code>, <code>!</code>'],
            ['Punctuation', 'SEMI, COMMA, LPAREN, RPAREN, LBRACE, RBRACE', '<code>;</code>, <code>{</code>, <code>}</code>'],
            ['Assignment', 'ASSIGN, PLUS_ASSIGN, MINUS_ASSIGN', '<code>=</code>, <code>+=</code>'],
          ]
        },
        { type: 'code', label: 'lexer.py — A simple C lexer', code: `import re

class Token:
    def __init__(self, type, value, line):
        self.type = type
        self.value = value
        self.line = line
    def __repr__(self):
        return f"Token({self.type}, {self.value!r})"

KEYWORDS = {'int', 'char', 'void', 'if', 'else', 'while', 'for',
            'return', 'struct', 'sizeof'}

TOKEN_SPEC = [
    ('COMMENT',    r'//[^\\n]*'),
    ('BLOCK_COMMENT', r'/\\*[\\s\\S]*?\\*/'),
    ('WHITESPACE', r'\\s+'),
    ('INT_LIT',    r'0[xX][0-9a-fA-F]+|\\d+'),
    ('CHAR_LIT',   r"'(\\\\.|[^'])'"),
    ('STRING_LIT', r'"(\\\\.|[^"])*"'),
    ('ARROW',      r'->'),
    ('EQ',         r'=='),
    ('NEQ',        r'!='),
    ('LTE',        r'<='),
    ('GTE',        r'>='),
    ('AND',        r'&&'),
    ('OR',         r'\\|\\|'),
    ('LSHIFT',     r'<<'),
    ('RSHIFT',     r'>>'),
    ('PLUS_PLUS',  r'\\+\\+'),
    ('MINUS_MINUS',r'--'),
    ('PLUS_ASSIGN',r'\\+='),
    ('MINUS_ASSIGN',r'-='),
    ('IDENT',      r'[a-zA-Z_][a-zA-Z0-9_]*'),
    ('ASSIGN',     r'='),
    ('PLUS',       r'\\+'),
    ('MINUS',      r'-'),
    ('STAR',       r'\\*'),
    ('SLASH',      r'/'),
    ('PERCENT',    r'%'),
    ('AMP',        r'&'),
    ('PIPE',       r'\\|'),
    ('CARET',      r'\\^'),
    ('TILDE',      r'~'),
    ('BANG',       r'!'),
    ('LT',         r'<'),
    ('GT',         r'>'),
    ('SEMI',       r';'),
    ('COMMA',      r','),
    ('DOT',        r'\\.'),
    ('LPAREN',     r'\\('),
    ('RPAREN',     r'\\)'),
    ('LBRACE',     r'\\{'),
    ('RBRACE',     r'\\}'),
    ('LBRACKET',   r'\\['),
    ('RBRACKET',   r'\\]'),
]

def tokenize(source):
    tokens = []
    pos = 0
    line = 1
    master_re = '|'.join(f'(?P<{name}>{pattern})' for name, pattern in TOKEN_SPEC)
    for m in re.finditer(master_re, source):
        kind = m.lastgroup
        value = m.group()
        line += value.count('\\n')
        if kind in ('WHITESPACE', 'COMMENT', 'BLOCK_COMMENT'):
            continue
        if kind == 'IDENT' and value in KEYWORDS:
            kind = value.upper()  # e.g., 'int' -> 'INT'
        tokens.append(Token(kind, value, line))
    tokens.append(Token('EOF', '', line))
    return tokens

# Test:
code = 'int main() { int x = 10 + 20; return x; }'
for tok in tokenize(code):
    print(tok)` },
        { type: 'text', html: `
<h2>Building a Parser</h2>
<p>The parser takes the token stream and builds an AST. We'll use <strong>recursive descent</strong> — the simplest and most intuitive parsing technique. Each grammar rule becomes a function that consumes tokens and returns an AST node.</p>

<h3>Grammar for Our C Subset</h3>
<p>Here's a simplified grammar in BNF notation:</p>
` },
        { type: 'code', label: 'Grammar (simplified BNF)', code: `program     = { function_def | global_var }
function_def = type IDENT "(" params ")" block
params      = [ type IDENT { "," type IDENT } ]
type        = "int" | "char" | "void" | type "*"
block       = "{" { statement } "}"
statement   = var_decl | if_stmt | while_stmt | for_stmt
            | return_stmt | expr_stmt | block
var_decl    = type IDENT [ "=" expr ] ";"
if_stmt     = "if" "(" expr ")" statement [ "else" statement ]
while_stmt  = "while" "(" expr ")" statement
for_stmt    = "for" "(" [expr] ";" [expr] ";" [expr] ")" statement
return_stmt = "return" [ expr ] ";"
expr_stmt   = expr ";"

expr        = assign_expr
assign_expr = ternary [ "=" assign_expr ]
ternary     = or_expr
or_expr     = and_expr { "||" and_expr }
and_expr    = eq_expr { "&&" eq_expr }
eq_expr     = rel_expr { ("==" | "!=") rel_expr }
rel_expr    = add_expr { ("<" | ">" | "<=" | ">=") add_expr }
add_expr    = mul_expr { ("+" | "-") mul_expr }
mul_expr    = unary { ("*" | "/" | "%") unary }
unary       = ("!" | "-" | "~" | "*" | "&") unary | postfix
postfix     = primary { "[" expr "]" | "(" args ")" | "." IDENT | "->" IDENT }
primary     = INT_LIT | CHAR_LIT | STRING_LIT | IDENT | "(" expr ")"` },
        { type: 'text', html: `
<h3>AST Node Types</h3>
<p>We define a class for each type of AST node:</p>` },
        { type: 'code', label: 'ast.py — AST node definitions', code: `class Program:
    def __init__(self, declarations):
        self.declarations = declarations

class FuncDef:
    def __init__(self, return_type, name, params, body):
        self.return_type = return_type
        self.name = name
        self.params = params  # [(type, name), ...]
        self.body = body

class VarDecl:
    def __init__(self, type, name, init=None):
        self.type = type
        self.name = name
        self.init = init  # expression or None

class Block:
    def __init__(self, stmts):
        self.stmts = stmts

class IfStmt:
    def __init__(self, cond, then_body, else_body=None):
        self.cond = cond
        self.then_body = then_body
        self.else_body = else_body

class WhileStmt:
    def __init__(self, cond, body):
        self.cond = cond
        self.body = body

class ReturnStmt:
    def __init__(self, expr=None):
        self.expr = expr

class BinOp:
    def __init__(self, op, left, right):
        self.op = op
        self.left = left
        self.right = right

class UnaryOp:
    def __init__(self, op, operand):
        self.op = op
        self.operand = operand

class IntLit:
    def __init__(self, value):
        self.value = value

class Ident:
    def __init__(self, name):
        self.name = name

class FuncCall:
    def __init__(self, name, args):
        self.name = name
        self.args = args

class ArrayAccess:
    def __init__(self, array, index):
        self.array = array
        self.index = index

class Assign:
    def __init__(self, target, value):
        self.target = target
        self.value = value` },
        { type: 'text', html: `<h3>Recursive Descent Parser</h3>
<p>Each grammar rule maps to a function. The parser maintains a position in the token stream and advances through it:</p>` },
        { type: 'code', label: 'parser.py — Core parsing functions', code: `class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos]

    def advance(self):
        tok = self.tokens[self.pos]
        self.pos += 1
        return tok

    def expect(self, type):
        tok = self.advance()
        if tok.type != type:
            raise SyntaxError(
                f"Line {tok.line}: expected {type}, got {tok.type} ({tok.value!r})")
        return tok

    def match(self, *types):
        if self.peek().type in types:
            return self.advance()
        return None

    # --- Expression Parsing (Pratt-style precedence climbing) ---

    def parse_expr(self):
        return self.parse_assignment()

    def parse_assignment(self):
        left = self.parse_or()
        if self.match('ASSIGN'):
            right = self.parse_assignment()  # Right-associative
            return Assign(left, right)
        return left

    def parse_or(self):
        left = self.parse_and()
        while self.match('OR'):
            right = self.parse_and()
            left = BinOp('||', left, right)
        return left

    def parse_and(self):
        left = self.parse_equality()
        while self.match('AND'):
            right = self.parse_equality()
            left = BinOp('&&', left, right)
        return left

    def parse_equality(self):
        left = self.parse_relational()
        while tok := self.match('EQ', 'NEQ'):
            right = self.parse_relational()
            left = BinOp(tok.value, left, right)
        return left

    def parse_relational(self):
        left = self.parse_additive()
        while tok := self.match('LT', 'GT', 'LTE', 'GTE'):
            right = self.parse_additive()
            left = BinOp(tok.value, left, right)
        return left

    def parse_additive(self):
        left = self.parse_multiplicative()
        while tok := self.match('PLUS', 'MINUS'):
            right = self.parse_multiplicative()
            left = BinOp(tok.value, left, right)
        return left

    def parse_multiplicative(self):
        left = self.parse_unary()
        while tok := self.match('STAR', 'SLASH', 'PERCENT'):
            right = self.parse_unary()
            left = BinOp(tok.value, left, right)
        return left

    def parse_unary(self):
        if tok := self.match('MINUS', 'BANG', 'TILDE'):
            operand = self.parse_unary()
            return UnaryOp(tok.value, operand)
        if self.match('STAR'):  # Dereference
            operand = self.parse_unary()
            return UnaryOp('*', operand)
        if self.match('AMP'):   # Address-of
            operand = self.parse_unary()
            return UnaryOp('&', operand)
        return self.parse_primary()

    def parse_primary(self):
        tok = self.peek()
        if tok.type == 'INT_LIT':
            self.advance()
            return IntLit(int(tok.value, 0))
        if tok.type == 'IDENT':
            self.advance()
            if self.match('LPAREN'):  # Function call
                args = []
                if self.peek().type != 'RPAREN':
                    args.append(self.parse_expr())
                    while self.match('COMMA'):
                        args.append(self.parse_expr())
                self.expect('RPAREN')
                return FuncCall(tok.value, args)
            return Ident(tok.value)
        if self.match('LPAREN'):
            expr = self.parse_expr()
            self.expect('RPAREN')
            return expr
        raise SyntaxError(f"Line {tok.line}: unexpected {tok.type}")` },
        { type: 'info', variant: 'info', title: 'Operator Precedence',
          html: '<p>Notice how the parsing functions are layered: <code>parse_additive</code> calls <code>parse_multiplicative</code>, which calls <code>parse_unary</code>, which calls <code>parse_primary</code>. This nesting naturally implements operator precedence — multiplication binds tighter than addition because it is parsed deeper in the call stack.</p>' },
        { type: 'text', html: `<h3>Parsing Statements, Blocks, and Functions</h3>
<p>The expression parser above only handles expressions. To parse a complete C program we also need <code>parse_stmt</code> (dispatches to the right statement kind), <code>parse_block</code> (a <code>{...}</code> sequence of statements), and <code>parse_function</code> (the top-level declaration). These are not optional exercises — they are critical path:</p>` },
        { type: 'code', label: 'parser.py — Statement, block, and function parsing', code: `    # --- Statement Parsing ---

    def is_type(self):
        """Check if current token starts a type specifier."""
        return self.peek().type in ('INT', 'CHAR', 'VOID')

    def parse_type(self):
        """Parse a type: int, char, void, or pointer types like int*."""
        tok = self.expect(self.peek().type)  # consume INT/CHAR/VOID
        type_name = tok.value
        while self.match('STAR'):
            type_name += '*'
        return type_name

    def parse_stmt(self):
        """Parse a single statement — dispatches by token type."""
        tok = self.peek()

        if tok.type == 'LBRACE':
            return self.parse_block()

        elif tok.type == 'IF':
            self.advance()
            self.expect('LPAREN')
            cond = self.parse_expr()
            self.expect('RPAREN')
            then_body = self.parse_stmt()
            else_body = None
            if self.match('ELSE'):
                else_body = self.parse_stmt()
            return IfStmt(cond, then_body, else_body)

        elif tok.type == 'WHILE':
            self.advance()
            self.expect('LPAREN')
            cond = self.parse_expr()
            self.expect('RPAREN')
            body = self.parse_stmt()
            return WhileStmt(cond, body)

        elif tok.type == 'FOR':
            self.advance()
            self.expect('LPAREN')
            # for (init; cond; update) body
            init = None
            if not self.match('SEMI'):
                if self.is_type():
                    init = self.parse_var_decl()  # consumes semicolon
                else:
                    init = self.parse_expr()
                    self.expect('SEMI')
            cond = None
            if not self.match('SEMI'):
                cond = self.parse_expr()
                self.expect('SEMI')
            update = None
            if self.peek().type != 'RPAREN':
                update = self.parse_expr()
            self.expect('RPAREN')
            body = self.parse_stmt()
            # Desugar for-loop into init + while:
            stmts = []
            if init: stmts.append(init)
            loop_body_stmts = [body]
            if update: loop_body_stmts.append(update)
            if cond is None: cond = IntLit(1)  # for(;;) = infinite
            stmts.append(WhileStmt(cond, Block(loop_body_stmts)))
            return Block(stmts)

        elif tok.type == 'RETURN':
            self.advance()
            expr = None
            if self.peek().type != 'SEMI':
                expr = self.parse_expr()
            self.expect('SEMI')
            return ReturnStmt(expr)

        elif self.is_type():
            return self.parse_var_decl()

        else:
            # Expression statement (assignment, function call, etc.)
            expr = self.parse_expr()
            self.expect('SEMI')
            return expr

    def parse_var_decl(self):
        """Parse: type name [= expr] ;"""
        vtype = self.parse_type()
        name = self.expect('IDENT').value
        init = None
        if self.match('ASSIGN'):
            init = self.parse_expr()
        self.expect('SEMI')
        return VarDecl(vtype, name, init)

    def parse_block(self):
        """Parse: { stmt* }"""
        self.expect('LBRACE')
        stmts = []
        while self.peek().type != 'RBRACE':
            stmts.append(self.parse_stmt())
        self.expect('RBRACE')
        return Block(stmts)

    def parse_function(self):
        """Parse: type name(params) block"""
        ret_type = self.parse_type()
        name = self.expect('IDENT').value
        self.expect('LPAREN')
        params = []
        if self.peek().type != 'RPAREN':
            ptype = self.parse_type()
            pname = self.expect('IDENT').value
            params.append((ptype, pname))
            while self.match('COMMA'):
                ptype = self.parse_type()
                pname = self.expect('IDENT').value
                params.append((ptype, pname))
        self.expect('RPAREN')
        body = self.parse_block()
        return FuncDef(ret_type, name, params, body)

    def parse_program(self):
        """Top level: parse functions until EOF."""
        decls = []
        while self.peek().type != 'EOF':
            decls.append(self.parse_function())
        return Program(decls)` },
        { type: 'text', html: `<h3>End-to-End Example: Source to Tokens to AST</h3>
<p>Here is a complete trace showing a small C function going through the lexer and parser. This is the full pipeline you have now built:</p>` },
        { type: 'code', label: 'End-to-end: C source to tokens to AST', code: `# --- Input C source ---
source = """
int double_it(int x) {
    return x * 2;
}
"""

# --- Step 1: Lexing ---
tokens = tokenize(source)
# Token stream:
#   Token(INT,     'int')
#   Token(IDENT,   'double_it')
#   Token(LPAREN,  '(')
#   Token(INT,     'int')
#   Token(IDENT,   'x')
#   Token(RPAREN,  ')')
#   Token(LBRACE,  '{')
#   Token(RETURN,  'return')
#   Token(IDENT,   'x')
#   Token(STAR,    '*')
#   Token(INT_LIT, '2')
#   Token(SEMI,    ';')
#   Token(RBRACE,  '}')
#   Token(EOF,     '')

# --- Step 2: Parsing ---
parser = Parser(tokens)
ast = parser.parse_program()

# --- Resulting AST ---
# Program
#   FuncDef
#     return_type: "int"
#     name: "double_it"
#     params: [("int", "x")]
#     body: Block
#       ReturnStmt
#         expr: BinOp('*')
#           left:  Ident("x")
#           right: IntLit(2)

# --- Step 3: Code Generation (preview of Lesson 3) ---
# The code generator would walk this AST and emit:
#
#   double_it:
#       PUSH {FP, LR}
#       MOV  FP, SP
#       PUSH {R0}           ; save param x at [FP, #-4]
#       LDR  R0, [FP, #-4]  ; load x
#       PUSH {R0}
#       MOV  R0, #2          ; load 2
#       POP  {R1}            ; R1 = x
#       MUL  R0, R1, R0      ; R0 = x * 2
#       MOV  SP, FP
#       POP  {FP, PC}        ; return with result in R0` },
        { type: 'video', id: 'SToUyjAsaFk', title: 'Pratt Parser From Scratch (Tsoding)' },
        { type: 'video', id: '4m7ubrdbWQU', title: 'Parsing Explained (Computerphile)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the lexer and test it on a small C program with variables, arithmetic, and a function',
          'Add string literal support to the lexer (handle escape sequences like \\n, \\t, \\\\)',
          'Implement the parser for statements: parse_if, parse_while, parse_return, parse_var_decl, parse_block',
          'Parse this program and print the AST: <code>int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }</code>',
          'Add error recovery: when the parser encounters an unexpected token, skip to the next semicolon and continue',
          'Implement a pretty-printer that takes an AST and outputs formatted C code (useful for debugging)',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'Pratt Parsing Made Easy (matklad)', url: 'https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html', desc: 'The clearest explanation of Pratt parsing' },
          { type: 'Tutorial', title: 'Nora Sandler: Writing a C Compiler', url: 'https://norasandler.com/2017/11/29/Write-a-Compiler.html', desc: 'Incremental C compiler tutorial — start here' },
          { type: 'Book', title: 'Crafting Interpreters — Chapter 6: Parsing', url: 'https://craftinginterpreters.com/parsing-expressions.html', desc: 'Excellent recursive descent parsing tutorial' },
          { type: 'Article', title: "Eli Bendersky: Recursive Descent", url: 'https://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing', desc: 'Precedence climbing explained' },
        ]},
      ],
    },
    {
      id: 3,
      title: "Code Generation for ARM",
      subtitle: "Walking the AST, emitting ARM assembly, calling conventions",
      duration: "2 hrs",
      content: [
        { type: 'text', html: `
<h2>Code Generation</h2>
<p>The code generator walks the AST and emits ARM assembly instructions. This is where the abstract program becomes concrete machine instructions. We need to handle:</p>
<ul>
<li><strong>Expressions:</strong> Arithmetic, comparisons, function calls</li>
<li><strong>Variables:</strong> Stack allocation and access</li>
<li><strong>Control flow:</strong> if/else, while, for translated to branches</li>
<li><strong>Functions:</strong> Calling convention, stack frames, parameter passing</li>
</ul>

<h3>The ARM Calling Convention (AAPCS)</h3>
<p>When functions call each other, they must agree on how to pass arguments and return values. ARM uses the <strong>AAPCS</strong> (ARM Architecture Procedure Call Standard):</p>
` },
        { type: 'table', headers: ['Register', 'Purpose', 'Caller/Callee Saved'],
          rows: [
            ['R0-R3', 'Arguments and return value', 'Caller-saved (can be trashed by callee)'],
            ['R4-R11', 'General purpose', 'Callee-saved (must be preserved)'],
            ['R12 (IP)', 'Intra-procedure scratch', 'Caller-saved'],
            ['R13 (SP)', 'Stack pointer', 'Callee-saved'],
            ['R14 (LR)', 'Link register (return address)', 'Callee-saved'],
            ['R15 (PC)', 'Program counter', 'Special'],
          ]
        },
        { type: 'text', html: `
<h3>Stack Frame Layout</h3>
<p>Each function gets a <strong>stack frame</strong> that holds its local variables, saved registers, and the return address:</p>
` },
        { type: 'diagram', content: `
Stack Frame for:  int foo(int a, int b) { int x = 10; int y = 20; ... }

Higher addresses
  ┌─────────────┐
  │  arg b (R1) │  ← Saved by caller if needed
  │  arg a (R0) │
  ├─────────────┤
  │  Return Addr│  ← LR pushed by PUSH {LR}
  │  Saved R4   │  ← Callee-saved registers
  │  Saved R5   │
  ├─────────────┤  ← Frame Pointer (FP / R11)
  │  local x    │  [FP, #-4]
  │  local y    │  [FP, #-8]
  ├─────────────┤  ← Stack Pointer (SP)
  │  (free)     │
Lower addresses` },
        { type: 'text', html: `<h3>Generating Code for Expressions</h3>
<p>The simplest approach: evaluate each expression and leave the result in R0. For binary operations, evaluate left into R0, push it, evaluate right into R0, pop left into R1, then compute.</p>` },
        { type: 'code', label: 'codegen.py — Expression code generation', code: `class CodeGen:
    def __init__(self):
        self.output = []
        self.label_count = 0
        self.locals = {}        # name -> stack offset
        self.stack_offset = 0

    def emit(self, line):
        self.output.append(line)

    def new_label(self, prefix="L"):
        self.label_count += 1
        return f"{prefix}_{self.label_count}"

    def gen_expr(self, node):
        """Generate code for an expression. Result goes in R0."""
        if isinstance(node, IntLit):
            self.emit(f"    MOV R0, #{node.value}")

        elif isinstance(node, Ident):
            offset = self.locals[node.name]
            self.emit(f"    LDR R0, [FP, #{offset}]")

        elif isinstance(node, BinOp):
            # Evaluate left, push, evaluate right, pop left into R1
            self.gen_expr(node.left)
            self.emit("    PUSH {R0}")
            self.gen_expr(node.right)
            self.emit("    POP {R1}")  # R1 = left, R0 = right
            # Now R1 = left, R0 = right
            if node.op == '+':
                self.emit("    ADD R0, R1, R0")
            elif node.op == '-':
                self.emit("    SUB R0, R1, R0")
            elif node.op == '*':
                self.emit("    MUL R0, R1, R0")
            elif node.op in ('<', '>', '<=', '>=', '==', '!='):
                self.emit("    CMP R1, R0")
                label_true = self.new_label("true")
                label_end = self.new_label("end")
                cond = {'<':'LT', '>':'GT', '<=':'LE',
                        '>=':'GE', '==':'EQ', '!=':'NE'}[node.op]
                self.emit(f"    B{cond} {label_true}")
                self.emit("    MOV R0, #0")
                self.emit(f"    B {label_end}")
                self.emit(f"{label_true}:")
                self.emit("    MOV R0, #1")
                self.emit(f"{label_end}:")

        elif isinstance(node, Assign):
            self.gen_expr(node.value)
            offset = self.locals[node.target.name]
            self.emit(f"    STR R0, [FP, #{offset}]")

        elif isinstance(node, UnaryOp):
            self.gen_expr(node.operand)
            if node.op == '-':
                # Negate: -x  =>  RSB R0, R0, #0  (R0 = 0 - R0)
                self.emit("    RSB R0, R0, #0")
            elif node.op == '*':
                # Dereference: *p  =>  LDR R0, [R0]
                self.emit("    LDR R0, [R0]")
            elif node.op == '&':
                # Address-of: &x  =>  ADD R0, FP, #offset
                # operand must be an Ident so we can look up its stack offset
                if isinstance(node.operand, Ident):
                    offset = self.locals[node.operand.name]
                    self.emit(f"    ADD R0, FP, #{offset}")
                else:
                    raise Exception("Address-of requires an lvalue")
            elif node.op == '~':
                self.emit("    MVN R0, R0")
            elif node.op == '!':
                # Logical NOT: !x  =>  CMP R0, #0; MOVEQ R0, #1; MOVNE R0, #0
                self.emit("    CMP R0, #0")
                self.emit("    MOVEQ R0, #1")
                self.emit("    MOVNE R0, #0")

        elif isinstance(node, FuncCall):
            # Evaluate each argument, push onto stack to preserve across evals
            for arg in node.args[:4]:
                self.gen_expr(arg)
                self.emit("    PUSH {R0}")
            # Pop args from stack into R0-R3 in reverse order
            for i in range(min(len(node.args), 4) - 1, -1, -1):
                self.emit(f"    POP {{R{i}}}")
            self.emit(f"    BL {node.name}")
            # Result is in R0` },
        { type: 'text', html: `<h3>Generating Control Flow</h3>` },
        { type: 'code', label: 'Control flow code generation', code: `    def gen_stmt(self, node):
        if isinstance(node, ReturnStmt):
            if node.expr:
                self.gen_expr(node.expr)
            self.emit("    MOV SP, FP")
            self.emit("    POP {FP, PC}")

        elif isinstance(node, IfStmt):
            else_label = self.new_label("else")
            end_label = self.new_label("endif")
            self.gen_expr(node.cond)
            self.emit("    CMP R0, #0")
            self.emit(f"    BEQ {else_label}")
            self.gen_stmt(node.then_body)
            self.emit(f"    B {end_label}")
            self.emit(f"{else_label}:")
            if node.else_body:
                self.gen_stmt(node.else_body)
            self.emit(f"{end_label}:")

        elif isinstance(node, WhileStmt):
            loop_label = self.new_label("while")
            end_label = self.new_label("endwhile")
            self.emit(f"{loop_label}:")
            self.gen_expr(node.cond)
            self.emit("    CMP R0, #0")
            self.emit(f"    BEQ {end_label}")
            self.gen_stmt(node.body)
            self.emit(f"    B {loop_label}")
            self.emit(f"{end_label}:")

        elif isinstance(node, VarDecl):
            self.stack_offset -= 4
            self.locals[node.name] = self.stack_offset
            self.emit("    SUB SP, SP, #4")
            if node.init:
                self.gen_expr(node.init)
                self.emit(f"    STR R0, [FP, #{self.stack_offset}]")

        elif isinstance(node, Block):
            for stmt in node.stmts:
                self.gen_stmt(stmt)

    def gen_function(self, func):
        self.locals = {}
        self.stack_offset = 0
        self.emit(f"{func.name}:")
        self.emit("    PUSH {FP, LR}")
        self.emit("    MOV FP, SP")
        # Map parameters to their positions
        for i, (ptype, pname) in enumerate(func.params[:4]):
            self.stack_offset -= 4
            self.locals[pname] = self.stack_offset
            self.emit("    PUSH {R" + str(i) + "}")
        # Generate body
        self.gen_stmt(func.body)
        # Default return
        self.emit("    MOV SP, FP")
        self.emit("    POP {FP, PC}")` },
        { type: 'text', html: `<h3>For-Loop Code Generation</h3>
<p>A <code>for</code> loop is syntactic sugar for a <code>while</code> loop. The parser desugars it (as shown in Lesson 2), but if you prefer to handle it directly in codegen, the decomposition is:</p>
<pre><code>// for (init; cond; update) body
//
// becomes:
//   init
//   while (cond) {
//       body
//       update
//   }

// Example: for (int i = 0; i &lt; 10; i = i + 1) { sum = sum + i; }
// Generates:
//   SUB  SP, SP, #4        ; allocate i
//   MOV  R0, #0
//   STR  R0, [FP, #-4]     ; i = 0
// for_1:
//   LDR  R0, [FP, #-4]     ; load i
//   PUSH {R0}
//   MOV  R0, #10
//   POP  {R1}
//   CMP  R1, R0             ; i &lt; 10?
//   BLT  true_2
//   MOV  R0, #0
//   B    end_3
// true_2:
//   MOV  R0, #1
// end_3:
//   CMP  R0, #0
//   BEQ  endfor_4
//   ... body (sum = sum + i) ...
//   LDR  R0, [FP, #-4]     ; update: i = i + 1
//   PUSH {R0}
//   MOV  R0, #1
//   POP  {R1}
//   ADD  R0, R1, R0
//   STR  R0, [FP, #-4]
//   B    for_1
// endfor_4:</code></pre>` },
        { type: 'info', variant: 'warning', title: 'Division on ARM',
          html: '<p>ARM (ARMv4/v5) has no hardware integer divide instruction. For the <code>/</code> and <code>%</code> operators, the code generator must emit <code>BL __aeabi_idiv</code> (for signed division) or <code>BL __aeabi_uidiv</code> (unsigned), which are helper functions you provide in your libc. The convention is: dividend in R0, divisor in R1, quotient returned in R0, remainder in R1. You must implement these functions in assembly or C as part of your runtime library.</p>' },
        { type: 'code', label: 'Example: C to ARM compilation', code: `// C source:
int sum(int n) {
    int total = 0;
    int i = 1;
    while (i <= n) {
        total = total + i;
        i = i + 1;
    }
    return total;
}

// Generated ARM assembly:
sum:
    PUSH {FP, LR}
    MOV  FP, SP
    PUSH {R0}          ; save param n at [FP, #-4]
    SUB  SP, SP, #4    ; local total at [FP, #-8]
    MOV  R0, #0
    STR  R0, [FP, #-8]
    SUB  SP, SP, #4    ; local i at [FP, #-12]
    MOV  R0, #1
    STR  R0, [FP, #-12]
while_1:
    LDR  R0, [FP, #-12]  ; load i
    PUSH {R0}
    LDR  R0, [FP, #-4]   ; load n
    POP  {R1}
    CMP  R1, R0
    BLE  true_2
    MOV  R0, #0
    B    end_3
true_2:
    MOV  R0, #1
end_3:
    CMP  R0, #0
    BEQ  endwhile_4
    ; total = total + i
    LDR  R0, [FP, #-8]
    PUSH {R0}
    LDR  R0, [FP, #-12]
    POP  {R1}
    ADD  R0, R1, R0
    STR  R0, [FP, #-8]
    ; i = i + 1
    LDR  R0, [FP, #-12]
    PUSH {R0}
    MOV  R0, #1
    POP  {R1}
    ADD  R0, R1, R0
    STR  R0, [FP, #-12]
    B    while_1
endwhile_4:
    LDR  R0, [FP, #-8]   ; return total
    MOV  SP, FP
    POP  {FP, PC}` },
        { type: 'info', variant: 'warning', title: 'This Code Is Unoptimized',
          html: '<p>The generated assembly is deliberately naive — it pushes/pops for every operation and loads/stores every variable access. A real compiler would keep values in registers and avoid redundant memory accesses. But this approach is <strong>correct</strong> and <strong>simple</strong>, which is exactly what we want for a first compiler. Optimization can come later.</p>' },
        { type: 'video', id: 'Os7FE3J-U5Q', title: 'ARM Assembly and C Calling Convention' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Compile by hand: write the ARM assembly for <code>int max(int a, int b) { if (a > b) return a; else return b; }</code>',
          'Implement gen_function and gen_stmt for your code generator. Test with a simple function that adds two numbers.',
          'Add support for the for loop: <code>for (int i = 0; i < 10; i++) { ... }</code>',
          'Add pointer support: dereference (<code>*p</code>) generates LDR, address-of (<code>&x</code>) generates ADD with frame pointer offset',
          'Test your complete pipeline: write a C program, lex it, parse it, generate assembly, assemble it, run on your CPU in Verilator',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Azeria Labs: ARM Calling Convention', url: 'https://azeria-labs.com/functions-and-the-stack-part-7/', desc: 'ARM stack frames and calling convention explained visually' },
          { type: 'Article', title: 'Compiling to Assembly from Scratch (Keleshev)', url: 'https://keleshev.com/compiling-to-assembly-from-scratch/', desc: 'Book/blog about compiling a simple language to ARM' },
          { type: 'Project', title: 'chibicc: Tiny C Compiler', url: 'https://github.com/rui314/chibicc', desc: 'Small C compiler with readable code generation' },
        ]},
      ],
    },
    {
      id: 4,
      title: "Writing a Linker",
      subtitle: "Object files, ELF format, symbol resolution, and relocation",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>What Is a Linker?</h2>
<p>When you compile a program with multiple source files, each file is compiled independently into an <strong>object file</strong> (.o). The <strong>linker</strong> combines these object files into a single executable by:</p>
<ol>
<li><strong>Collecting sections:</strong> Merge all .text (code) sections, all .data sections, etc.</li>
<li><strong>Resolving symbols:</strong> Connect function calls to their definitions across files</li>
<li><strong>Applying relocations:</strong> Patch addresses now that final positions are known</li>
<li><strong>Producing output:</strong> Generate the executable binary (ELF format)</li>
</ol>

<h3>The ELF File Format</h3>
<p>ELF (Executable and Linkable Format) is the standard binary format on Linux and many embedded systems. Both object files and executables use ELF.</p>
` },
        { type: 'diagram', content: `
ELF File Structure:

┌──────────────────┐
│    ELF Header    │  Magic number, architecture, entry point, etc.
│  (52 bytes ARM)  │
├──────────────────┤
│ Program Headers  │  Segments for loading (exec only)
│ (optional in .o) │
├──────────────────┤
│    .text         │  Machine code (executable instructions)
├──────────────────┤
│    .data         │  Initialized global variables
├──────────────────┤
│    .bss          │  Uninitialized globals (zero-filled at runtime)
├──────────────────┤
│    .rodata       │  Read-only data (string literals, constants)
├──────────────────┤
│    .symtab       │  Symbol table (function/variable names + addresses)
├──────────────────┤
│    .strtab       │  String table (names referenced by .symtab)
├──────────────────┤
│    .rel.text     │  Relocations for .text section
├──────────────────┤
│ Section Headers  │  Describes each section (name, size, offset, etc.)
└──────────────────┘` },
        { type: 'text', html: `<h4>ELF Header Fields</h4>
<p>The ELF header is the first thing in the file. For a 32-bit ARM binary it is 52 bytes:</p>` },
        { type: 'table', headers: ['Offset', 'Size', 'Field', 'Value (ARM)'],
          rows: [
            ['0x00', '4 bytes', 'Magic number', '0x7F 0x45 0x4C 0x46 ("\\x7FELF")'],
            ['0x04', '1 byte', 'Class', '1 = 32-bit (ELFCLASS32)'],
            ['0x05', '1 byte', 'Data encoding', '1 = little-endian (ELFDATA2LSB)'],
            ['0x06', '1 byte', 'ELF version', '1 (EV_CURRENT)'],
            ['0x07', '1 byte', 'OS/ABI', '0 (ELFOSABI_NONE)'],
            ['0x10', '2 bytes', 'Type', '2 = executable (ET_EXEC), 1 = relocatable (ET_REL)'],
            ['0x12', '2 bytes', 'Machine', '0x28 = ARM (EM_ARM)'],
            ['0x18', '4 bytes', 'Entry point', 'Virtual address of _start or main'],
            ['0x1C', '4 bytes', 'Program header offset', 'Offset to program header table (usually 52)'],
            ['0x20', '4 bytes', 'Section header offset', 'Offset to section header table'],
            ['0x2C', '2 bytes', 'Section header entry size', '40 bytes for 32-bit'],
            ['0x30', '2 bytes', 'Section header count', 'Number of sections'],
          ]
        },
        { type: 'text', html: `
<h3>Symbols and Relocation</h3>
<p>A <strong>symbol</strong> is a named entity — a function or global variable. Each object file has a symbol table listing:</p>
<ul>
<li><strong>Defined symbols:</strong> Functions/variables this file provides (e.g., <code>main</code> is defined in main.o)</li>
<li><strong>Undefined symbols:</strong> Functions/variables this file uses but doesn't define (e.g., <code>printf</code> is used but defined in libc)</li>
</ul>
<p>A <strong>relocation</strong> is a placeholder in the machine code that says "patch this address once you know where the target symbol ends up." For example, a <code>BL printf</code> instruction can't encode the final address of printf until linking.</p>
` },
        { type: 'code', label: 'linker.py — Simplified linker', code: `import struct

class Symbol:
    def __init__(self, name, section, offset, is_global=False):
        self.name = name
        self.section = section   # '.text', '.data', etc.
        self.offset = offset     # Offset within section
        self.is_global = is_global
        self.final_addr = None   # Set during linking

class Relocation:
    def __init__(self, offset, symbol_name, type):
        self.offset = offset      # Where in .text to patch
        self.symbol_name = symbol_name
        self.type = type          # 'R_ARM_CALL', 'R_ARM_ABS32', etc.

class ObjectFile:
    def __init__(self, name):
        self.name = name
        self.text = bytearray()   # Code bytes
        self.data = bytearray()   # Data bytes
        self.symbols = []
        self.relocations = []

class Linker:
    def __init__(self):
        self.objects = []
        self.global_symbols = {}  # name -> Symbol

    def add_object(self, obj):
        self.objects.append(obj)

    def link(self, output_file, entry='main', base_addr=0x10000):
        # Phase 1: Assign addresses to sections
        addr = base_addr
        for obj in self.objects:
            obj.text_addr = addr
            addr += len(obj.text)
        data_start = addr
        for obj in self.objects:
            obj.data_addr = addr
            addr += len(obj.data)

        # Phase 2: Build global symbol table
        for obj in self.objects:
            for sym in obj.symbols:
                if sym.section == '.text':
                    sym.final_addr = obj.text_addr + sym.offset
                elif sym.section == '.data':
                    sym.final_addr = obj.data_addr + sym.offset
                if sym.is_global:
                    if sym.name in self.global_symbols:
                        raise Exception(f"Duplicate symbol: {sym.name}")
                    self.global_symbols[sym.name] = sym

        # Phase 3: Apply relocations
        for obj in self.objects:
            for reloc in obj.relocations:
                target = self.global_symbols.get(reloc.symbol_name)
                if not target:
                    raise Exception(f"Undefined symbol: {reloc.symbol_name}")
                patch_addr = obj.text_addr + reloc.offset
                if reloc.type == 'R_ARM_ABS32':
                    # Patch with absolute address
                    struct.pack_into('<I', obj.text, reloc.offset,
                                    target.final_addr)
                elif reloc.type == 'R_ARM_CALL':
                    # BL instruction: encode relative offset
                    offset = (target.final_addr - patch_addr - 8) >> 2
                    offset &= 0x00FFFFFF
                    instr = struct.unpack_from('<I', obj.text, reloc.offset)[0]
                    instr = (instr & 0xFF000000) | offset
                    struct.pack_into('<I', obj.text, reloc.offset, instr)

        # Phase 4: Produce output binary
        output = bytearray()
        for obj in self.objects:
            output.extend(obj.text)
        for obj in self.objects:
            output.extend(obj.data)

        with open(output_file, 'wb') as f:
            f.write(output)

        entry_sym = self.global_symbols.get(entry)
        if entry_sym:
            print(f"Entry point: {entry} @ 0x{entry_sym.final_addr:08X}")
        print(f"Output: {output_file} ({len(output)} bytes)")` },
        { type: 'info', variant: 'info', title: 'Raw Binary vs. Full ELF',
          html: '<p>For simplicity, our linker produces a <strong>raw binary</strong> (just concatenated .text and .data bytes), not a full ELF file. A real linker would prepend a 52-byte ELF header, program headers for the loader, and section headers for debuggers. The raw binary approach works perfectly for bare-metal: we load the binary at a known base address and jump to the entry point. If you later want to run on Linux, you will need to emit proper ELF headers.</p>' },
        { type: 'info', variant: 'info', title: 'The ARM Pipeline Offset (-8)',
          html: '<p>Notice the <code>- 8</code> in the BL relocation formula: <code>offset = (target - patch_addr - 8) >> 2</code>. This accounts for the ARM pipeline. ARM uses a 3-stage pipeline (fetch, decode, execute), and by the time an instruction executes, the PC has already advanced 8 bytes past that instruction (two instructions ahead). So a branch at address 0x1000 sees PC = 0x1008. The <code>- 8</code> compensates for this, ensuring the branch offset is calculated from the actual PC value during execution, not from the instruction address.</p>' },
        { type: 'text', html: `<h3>End-to-End Linking Example</h3>
<p>Let us trace a concrete example of linking two source files into a single executable:</p>` },
        { type: 'code', label: 'Linking two files: main.c and math.c', code: `# === Source files ===
# main.c:                       math.c:
#   extern int add(int, int);     int add(int a, int b) {
#   int main() {                      return a + b;
#       return add(3, 4);         }
#   }

# === After compilation, we have two object files ===

# main.o:
#   .text (12 bytes):
#     0x00: MOV R0, #3          ; E3A00003
#     0x04: MOV R1, #4          ; E3A01004
#     0x08: BL  add             ; EB000000  (placeholder — offset unknown!)
#   symbols:
#     main  -> .text, offset=0, GLOBAL, DEFINED
#     add   -> UNDEFINED, GLOBAL
#   relocations:
#     offset=0x08, symbol="add", type=R_ARM_CALL

# math.o:
#   .text (8 bytes):
#     0x00: ADD R0, R0, R1      ; E0800001
#     0x04: BX  LR              ; E12FFF1E
#   symbols:
#     add   -> .text, offset=0, GLOBAL, DEFINED

# === Linking with base_addr = 0x10000 ===

# Phase 1: Assign addresses
#   main.o .text at 0x10000 (12 bytes)
#   math.o .text at 0x1000C (8 bytes)

# Phase 2: Resolve symbols
#   main  -> 0x10000
#   add   -> 0x1000C

# Phase 3: Apply relocations
#   Relocation at main.o offset 0x08 (addr 0x10008):
#     target = add = 0x1000C
#     patch_addr = 0x10008
#     offset = (0x1000C - 0x10008 - 8) >> 2 = (-4) >> 2 = -1
#     -1 in 24-bit = 0xFFFFFF
#     BL instruction: 0xEB000000 | 0xFFFFFF = 0xEBFFFFFF
#
#   Wait — that is negative because of the pipeline offset!
#   PC at execute time = 0x10008 + 8 = 0x10010
#   We want to reach 0x1000C, so offset = 0x1000C - 0x10010 = -4
#   -4 >> 2 = -1, encoded as 0xFFFFFF (24-bit signed)

# Phase 4: Output binary (20 bytes):
#   0x10000: E3A00003   ; MOV R0, #3
#   0x10004: E3A01004   ; MOV R1, #4
#   0x10008: EBFFFFFF   ; BL add (patched!)
#   0x1000C: E0800001   ; ADD R0, R0, R1
#   0x10010: E12FFF1E   ; BX LR

# Entry point: main @ 0x10000` },
        { type: 'video', id: 'dOfucXtyEsU', title: 'Linkers, Pair Programming, and Open Source (Computerphile)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Use <code>readelf -a</code> on a compiled ARM ELF binary to examine headers, sections, symbols, and relocations',
          'Implement the linker and test by linking two object files: one with main() that calls add(), and one that defines add()',
          'Add support for .data section: handle global variables with initial values',
          'Implement a linker script parser that lets you specify memory regions and section placement',
          'Research: what is Position Independent Code (PIC) and why do shared libraries need it?',
        ]},
        { type: 'resources', links: [
          { type: 'Article', title: 'ELF Format Overview (UCI)', url: 'https://ics.uci.edu/~aburtsev/238P/hw/hw3-elf/hw3-elf.html', desc: 'Concise ELF format reference' },
          { type: 'Article', title: 'Ian Lance Taylor: Linkers (20-part series)', url: 'https://lwn.net/Articles/276782/', desc: 'The definitive series on how linkers work — by the author of gold' },
          { type: 'Book', title: 'Linkers and Loaders (Levine)', url: 'https://www.iecc.com/linker/', desc: 'The classic book on linking and loading' },
          { type: 'Tool', title: 'readelf / objdump', url: 'https://man7.org/linux/man-pages/man1/readelf.1.html', desc: 'Standard tools for examining ELF files' },
        ]},
      ],
    },
    {
      id: 5,
      title: "Implementing malloc and libc",
      subtitle: "Building the heap allocator and essential C library functions",
      duration: "90 min",
      content: [
        { type: 'text', html: `
<h2>How malloc Works</h2>
<p>When you call <code>malloc(size)</code>, you get a pointer to <code>size</code> bytes of memory. But where does this memory come from? The answer involves understanding the <strong>heap</strong> — a region of memory that grows dynamically.</p>

<h3>Process Memory Layout</h3>
` },
        { type: 'diagram', content: `
Process Address Space:

High Address
  ┌─────────────┐
  │    Stack     │  ↓ Grows downward
  │  (local vars,│     Function calls push frames here
  │   returns)   │
  ├─────────────┤  ← Stack Pointer (SP)
  │             │
  │  (unmapped)  │
  │             │
  ├─────────────┤  ← Program Break (brk)
  │    Heap      │  ↑ Grows upward
  │  (malloc'd   │     malloc allocates from here
  │   memory)    │
  ├─────────────┤  ← Original brk
  │    .bss      │  Uninitialized globals (zeroed)
  ├─────────────┤
  │    .data     │  Initialized globals
  ├─────────────┤
  │    .text     │  Program code
  ├─────────────┤
Low Address` },
        { type: 'text', html: `
<h3>The sbrk System Call</h3>
<p><code>sbrk(increment)</code> moves the program break — the end of the heap — by <code>increment</code> bytes and returns the old break address. This is how the OS gives more memory to a process. Our kernel will implement this as a system call.</p>

<h3>Free List Allocator</h3>
<p>The simplest malloc design uses a <strong>free list</strong> — a linked list of free memory blocks. Each block has a header storing its size and whether it's free:</p>
` },
        { type: 'diagram', content: `
Heap with Free List:

  ┌────────┬────────────────┬────────┬──────────┬────────┬─────────────┐
  │ Header │  Used Block    │ Header │ FREE     │ Header │ Used Block  │
  │ size=32│  (32 bytes)    │ size=64│ (64 bytes)│ size=16│ (16 bytes) │
  │ free=0 │                │ free=1 │          │ free=0 │             │
  └────────┴────────────────┴────┬───┴──────────┴────────┴─────────────┘
                                 │
                                 └── Free list head
                                     (malloc returns this block
                                      for requests <= 64 bytes)` },
        { type: 'code', label: 'malloc.c — Simple heap allocator', code: `#include <stddef.h>

// Block header — placed before each allocation
typedef struct block_header {
    size_t size;                  // Size of the data area (not including header)
    int    free;                  // 1 = free, 0 = allocated
    struct block_header *next;    // Next block in the list
} block_header_t;

#define HEADER_SIZE sizeof(block_header_t)
#define ALIGN(size) (((size) + 7) & ~7)  // Align to 8 bytes

static block_header_t *free_list = NULL;
extern void *sbrk(int increment);  // Provided by our kernel

// Find a free block that fits, or extend the heap
void *malloc(size_t size) {
    if (size == 0) return NULL;
    size = ALIGN(size);

    // First fit: walk the free list
    block_header_t *curr = free_list;
    block_header_t *prev = NULL;

    while (curr) {
        if (curr->free && curr->size >= size) {
            // Found a fit! Split if much larger
            if (curr->size >= size + HEADER_SIZE + 16) {
                // Split: create a new free block after our allocation
                block_header_t *new_block =
                    (block_header_t *)((char *)curr + HEADER_SIZE + size);
                new_block->size = curr->size - size - HEADER_SIZE;
                new_block->free = 1;
                new_block->next = curr->next;
                curr->size = size;
                curr->next = new_block;
            }
            curr->free = 0;
            return (void *)((char *)curr + HEADER_SIZE);
        }
        prev = curr;
        curr = curr->next;
    }

    // No free block found — extend the heap
    block_header_t *block = (block_header_t *)sbrk(HEADER_SIZE + size);
    if (block == (void *)-1) return NULL;  // sbrk failed
    block->size = size;
    block->free = 0;
    block->next = NULL;

    if (prev)
        prev->next = block;
    else
        free_list = block;

    return (void *)((char *)block + HEADER_SIZE);
}

void free(void *ptr) {
    if (!ptr) return;
    block_header_t *block = (block_header_t *)((char *)ptr - HEADER_SIZE);
    block->free = 1;

    // Coalesce: merge adjacent free blocks
    block_header_t *curr = free_list;
    while (curr) {
        if (curr->free && curr->next && curr->next->free) {
            curr->size += HEADER_SIZE + curr->next->size;
            curr->next = curr->next->next;
        } else {
            curr = curr->next;
        }
    }
}` },
        { type: 'info', variant: 'info', title: 'Why 8-Byte Alignment (the ALIGN Macro)',
          html: '<p>The <code>ALIGN(size)</code> macro rounds up to the next multiple of 8: <code>((size) + 7) &amp; ~7</code>. For example, ALIGN(5) = 8, ALIGN(8) = 8, ALIGN(13) = 16. Why 8? ARM requires that certain data types be naturally aligned — a 32-bit word must be at a 4-byte boundary, and a 64-bit value (like <code>double</code> or <code>long long</code>) must be at an 8-byte boundary. An unaligned access on ARM either triggers a data abort or silently produces wrong results (depending on CPU configuration). By always aligning to 8, we guarantee any data type can safely be stored in any malloc\'d block.</p>' },
        { type: 'info', variant: 'warning', title: 'Coalescing Limitation',
          html: '<p>Our <code>free()</code> only coalesces <strong>forward</strong>: it merges a free block with the next block if both are free. But it cannot merge <em>backward</em> — if you free block B and block A (before it) is also free, they will not be merged because we have no pointer from B back to A. This causes fragmentation over time. The fix is a <strong>doubly-linked free list</strong>: add a <code>prev</code> pointer to each block header so you can check and merge in both directions. Another classic approach is <em>boundary tags</em> — store the block size at both the beginning and end of each block, so you can find the previous block in O(1) without an explicit back pointer.</p>' },
        { type: 'text', html: `
<h3>Minimal libc Functions</h3>
<p>Beyond malloc, C programs need basic library functions. Here are the essential ones:</p>` },
        { type: 'code', label: 'string.c — Core string/memory functions', code: `void *memcpy(void *dest, const void *src, size_t n) {
    char *d = dest;
    const char *s = src;
    while (n--) *d++ = *s++;
    return dest;
}

void *memset(void *s, int c, size_t n) {
    unsigned char *p = s;
    while (n--) *p++ = (unsigned char)c;
    return s;
}

size_t strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return p - s;
}

int strcmp(const char *s1, const char *s2) {
    while (*s1 && *s1 == *s2) { s1++; s2++; }
    return *(unsigned char *)s1 - *(unsigned char *)s2;
}

char *strcpy(char *dest, const char *src) {
    char *d = dest;
    while ((*d++ = *src++));
    return dest;
}

int strncmp(const char *s1, const char *s2, size_t n) {
    while (n && *s1 && *s1 == *s2) { s1++; s2++; n--; }
    return n ? *(unsigned char *)s1 - *(unsigned char *)s2 : 0;
}` },
        { type: 'code', label: 'printf.c — Simple printf (subset)', code: `// Simplified printf supporting %d, %s, %c, %x
#include <stdarg.h>

// putchar writes to UART via MMIO
extern void putchar(int c);

static void print_string(const char *s) {
    while (*s) putchar(*s++);
}

static void print_int(int n) {
    if (n < 0) { putchar('-'); n = -n; }
    if (n / 10) print_int(n / 10);
    putchar('0' + n % 10);
}

static void print_hex(unsigned int n) {
    const char *hex = "0123456789abcdef";
    if (n / 16) print_hex(n / 16);
    putchar(hex[n % 16]);
}

int printf(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    int count = 0;

    while (*fmt) {
        if (*fmt == '%') {
            fmt++;
            switch (*fmt) {
                case 'd': print_int(va_arg(args, int)); break;
                case 's': print_string(va_arg(args, char *)); break;
                case 'c': putchar(va_arg(args, int)); break;
                case 'x': print_hex(va_arg(args, unsigned int)); break;
                case '%': putchar('%'); break;
            }
        } else {
            putchar(*fmt);
        }
        fmt++;
        count++;
    }
    va_end(args);
    return count;
}` },
        { type: 'info', variant: 'info', title: 'How va_list and va_arg Work on ARM',
          html: '<p>On ARM, the first four arguments to any function are passed in registers R0-R3. For a variadic function like <code>printf(const char *fmt, ...)</code>, R0 holds <code>fmt</code> and R1-R3 hold the first three variadic arguments. Any additional variadic arguments are passed on the stack. The function prologue saves R1-R3 to the stack so that all variadic arguments are in a contiguous memory region. <code>va_list</code> is simply a pointer into this region. <code>va_start(args, fmt)</code> sets <code>args</code> to point just past the last named parameter. Each call to <code>va_arg(args, type)</code> reads <code>sizeof(type)</code> bytes from the current pointer and advances it. This is why variadic functions have no type safety — the function trusts the format string to correctly describe the types on the stack.</p>' },
        { type: 'video', id: 'HPDBOhiKaD8', title: 'Dynamic Memory Allocation — Jacob Sorber' },
        { type: 'video', id: '74s0m4YoHgM', title: 'How Does malloc Work? (Low Level Learning)' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement malloc and free. Test by allocating and freeing blocks of various sizes, then verify the free list is correct.',
          'Add a <code>realloc(ptr, new_size)</code> function that resizes an allocation (malloc new, memcpy, free old).',
          'Implement <code>calloc(count, size)</code> that allocates zeroed memory.',
          'Write a test that allocates 100 blocks, frees every other one, then allocates again — verify coalescing works.',
          'Implement the full set of string functions and write tests for edge cases (empty strings, overlapping memory for memmove).',
          'Implement <code>sprintf</code> that writes to a buffer instead of UART.',
        ]},
        { type: 'resources', links: [
          { type: 'Tutorial', title: 'Dan Luu: Malloc Tutorial', url: 'https://danluu.com/malloc-tutorial/', desc: 'The best tutorial on implementing malloc from scratch' },
          { type: 'Article', title: 'Embedded Artistry: Creating a Heap Allocator', url: 'https://embeddedartistry.com/blog/2017/02/22/generating-aligned-memory/', desc: 'Practical embedded malloc implementation' },
          { type: 'Article', title: 'Doug Lea: A Memory Allocator', url: 'http://gee.cs.oswego.edu/dl/html/malloc.html', desc: 'Design of dlmalloc — the allocator behind many libc implementations' },
        ]},
      ],
    },
    {
      id: 6,
      title: "Ethernet Controller in Verilog",
      subtitle: "Ethernet frame format, MII interface, and MAC design",
      duration: "2 hrs",
      content: [
        { type: 'text', html: `
<h2>Ethernet Fundamentals</h2>
<p>To give our computer network access, we need an <strong>Ethernet controller</strong>. Ethernet is the dominant wired networking technology — it defines how data is framed and transmitted over a cable.</p>

<h3>The Ethernet Stack</h3>
<p>Ethernet hardware has two layers:</p>
<ul>
<li><strong>PHY (Physical Layer):</strong> An analog chip that converts digital signals to/from electrical signals on the wire. We buy this chip — we don't build it.</li>
<li><strong>MAC (Media Access Controller):</strong> The digital logic that frames packets, computes checksums, and interfaces with the CPU. <strong>We build this in Verilog.</strong></li>
</ul>

<h3>Ethernet Frame Format</h3>
` },
        { type: 'diagram', content: `
Ethernet Frame (IEEE 802.3):

┌──────────┬─────┬──────────┬──────────┬──────┬─────────────────┬─────┐
│ Preamble │ SFD │ Dest MAC │ Src MAC  │ Type │    Payload      │ FCS │
│ 7 bytes  │ 1B  │ 6 bytes  │ 6 bytes  │ 2B   │  46-1500 bytes  │ 4B  │
└──────────┴─────┴──────────┴──────────┴──────┴─────────────────┴─────┘

Preamble: 10101010 x7 — lets receiver synchronize to the clock
SFD:      10101011    — Start Frame Delimiter, marks start of frame
Dest MAC: Destination hardware address (e.g., FF:FF:FF:FF:FF:FF = broadcast)
Src MAC:  Source hardware address
Type:     0x0800 = IPv4, 0x0806 = ARP
Payload:  The actual data (IP packet, ARP request, etc.)
FCS:      Frame Check Sequence — CRC-32 checksum of everything after SFD

Minimum frame size: 64 bytes (pad payload with zeros if needed)
Maximum frame size: 1518 bytes (without VLAN tag)` },
        { type: 'text', html: `
<h3>MII Interface (MAC to PHY)</h3>
<p>The MAC communicates with the PHY chip through a standard interface called <strong>MII</strong> (Media Independent Interface) or its reduced version <strong>RMII</strong>:</p>
` },
        { type: 'table', headers: ['Signal', 'Direction', 'Description'],
          rows: [
            ['TX_CLK', 'PHY → MAC', 'Transmit clock (25 MHz for 100 Mbps)'],
            ['TXD[3:0]', 'MAC → PHY', 'Transmit data (4 bits per clock = nibble)'],
            ['TX_EN', 'MAC → PHY', 'Transmit enable — high when sending'],
            ['RX_CLK', 'PHY → MAC', 'Receive clock'],
            ['RXD[3:0]', 'PHY → MAC', 'Receive data (4 bits per clock)'],
            ['RX_DV', 'PHY → MAC', 'Receive data valid'],
            ['MDIO/MDC', 'Bidirectional', 'Management interface for PHY configuration'],
          ]
        },
        { type: 'text', html: `<h3>CRC-32 for Ethernet</h3>
<p>Every Ethernet frame ends with a 4-byte CRC-32 checksum (the FCS). The receiver computes the CRC on the received data and compares — if they don't match, the frame is corrupt and discarded.</p>` },
        { type: 'code', label: 'crc32.v — CRC-32 for Ethernet (4-bit input)', code: `module crc32 (
    input  wire       clk,
    input  wire       reset,
    input  wire       enable,
    input  wire [3:0] data_in,  // Nibble input (MII is 4-bit)
    output wire [31:0] crc_out
);
    reg [31:0] crc;

    // CRC-32 polynomial: 0x04C11DB7
    // XOR new data into CRC, bit by bit (for 4 bits per clock)
    wire [31:0] next_crc;

    // Unrolled CRC computation for 4 bits
    wire [31:0] c = crc;
    wire [3:0]  d = data_in;

    assign next_crc[0]  = c[28] ^ d[0];
    assign next_crc[1]  = c[28] ^ c[29] ^ d[0] ^ d[1];
    assign next_crc[2]  = c[28] ^ c[29] ^ c[30] ^ d[0] ^ d[1] ^ d[2];
    assign next_crc[3]  = c[29] ^ c[30] ^ c[31] ^ d[1] ^ d[2] ^ d[3];
    assign next_crc[4]  = c[0]  ^ c[28] ^ c[30] ^ c[31] ^ d[0] ^ d[2] ^ d[3];
    assign next_crc[5]  = c[1]  ^ c[28] ^ c[29] ^ c[31] ^ d[0] ^ d[1] ^ d[3];
    assign next_crc[6]  = c[2]  ^ c[29] ^ c[30] ^ d[1] ^ d[2];
    assign next_crc[7]  = c[3]  ^ c[28] ^ c[30] ^ c[31] ^ d[0] ^ d[2] ^ d[3];
    assign next_crc[8]  = c[4]  ^ c[28] ^ c[29] ^ c[31] ^ d[0] ^ d[1] ^ d[3];
    assign next_crc[9]  = c[5]  ^ c[29] ^ c[30] ^ d[1] ^ d[2];
    assign next_crc[10] = c[6]  ^ c[28] ^ c[30] ^ c[31] ^ d[0] ^ d[2] ^ d[3];
    assign next_crc[11] = c[7]  ^ c[28] ^ c[29] ^ c[31] ^ d[0] ^ d[1] ^ d[3];
    assign next_crc[12] = c[8]  ^ c[28] ^ c[29] ^ c[30] ^ d[0] ^ d[1] ^ d[2];
    assign next_crc[13] = c[9]  ^ c[29] ^ c[30] ^ c[31] ^ d[1] ^ d[2] ^ d[3];
    assign next_crc[14] = c[10] ^ c[30] ^ c[31] ^ d[2] ^ d[3];
    assign next_crc[15] = c[11] ^ c[31] ^ d[3];
    assign next_crc[16] = c[12] ^ c[28] ^ d[0];
    assign next_crc[17] = c[13] ^ c[29] ^ d[1];
    assign next_crc[18] = c[14] ^ c[30] ^ d[2];
    assign next_crc[19] = c[15] ^ c[31] ^ d[3];
    assign next_crc[20] = c[16];
    assign next_crc[21] = c[17];
    assign next_crc[22] = c[18] ^ c[28] ^ d[0];
    assign next_crc[23] = c[19] ^ c[28] ^ c[29] ^ d[0] ^ d[1];
    assign next_crc[24] = c[20] ^ c[29] ^ c[30] ^ d[1] ^ d[2];
    assign next_crc[25] = c[21] ^ c[30] ^ c[31] ^ d[2] ^ d[3];
    assign next_crc[26] = c[22] ^ c[28] ^ c[31] ^ d[0] ^ d[3];
    assign next_crc[27] = c[23] ^ c[29] ^ d[1];
    assign next_crc[28] = c[24] ^ c[30] ^ d[2];
    assign next_crc[29] = c[25] ^ c[31] ^ d[3];
    assign next_crc[30] = c[26];
    assign next_crc[31] = c[27];

    always @(posedge clk) begin
        if (reset)
            crc <= 32'hFFFFFFFF;  // Initial value
        else if (enable)
            crc <= next_crc;
    end

    assign crc_out = ~crc;  // Final XOR
endmodule` },
        { type: 'text', html: `<h3>MAC Transmitter State Machine</h3>
<p>The MAC transmitter is a state machine that takes a frame from a buffer and drives the MII signals (TXD and TX_EN) to the PHY. It walks through these states: IDLE (waiting), PREAMBLE (7 bytes of 0x55), SFD (0xD5 start delimiter), DATA (frame bytes as nibbles while feeding the CRC engine), FCS (4 CRC bytes), and IFG (inter-frame gap, 96 bit times of silence):</p>` },
        { type: 'code', label: 'mac_tx.v — Ethernet MAC transmitter', code: `module mac_tx (
    input  wire        clk,         // TX_CLK from PHY (25 MHz for 100 Mbps)
    input  wire        reset,
    // CPU interface
    input  wire        tx_start,    // Pulse high to begin transmission
    input  wire [7:0]  tx_data,     // Byte from frame buffer
    input  wire [10:0] tx_len,      // Frame length in bytes (excl. preamble/SFD/FCS)
    output reg         tx_busy,     // High while transmitting
    output reg  [10:0] tx_byte_addr,// Address into frame buffer
    // MII interface to PHY
    output reg  [3:0]  txd,         // Transmit data (nibble)
    output reg         tx_en        // Transmit enable
);

    localparam IDLE     = 3'd0;
    localparam PREAMBLE = 3'd1;
    localparam SFD      = 3'd2;
    localparam DATA     = 3'd3;
    localparam FCS      = 3'd4;
    localparam IFG      = 3'd5;

    reg [2:0]  state;
    reg [4:0]  preamble_cnt;   // Count 14 nibbles (7 bytes of 0x55)
    reg        nibble_sel;     // 0 = low nibble, 1 = high nibble
    reg [10:0] byte_cnt;
    reg [4:0]  ifg_cnt;
    reg [2:0]  fcs_nibble_cnt; // 8 nibbles of FCS (4 bytes)

    // CRC-32 instance
    wire [31:0] crc_out;
    reg         crc_reset, crc_enable;
    reg  [3:0]  crc_data;

    crc32 crc_inst (
        .clk(clk), .reset(crc_reset),
        .enable(crc_enable), .data_in(crc_data),
        .crc_out(crc_out)
    );

    always @(posedge clk) begin
        if (reset) begin
            state    <= IDLE;
            tx_en    <= 0;
            tx_busy  <= 0;
            txd      <= 4'h0;
        end else begin
            case (state)
                IDLE: begin
                    tx_en <= 0;
                    tx_busy <= 0;
                    if (tx_start) begin
                        state <= PREAMBLE;
                        preamble_cnt <= 0;
                        tx_busy <= 1;
                        crc_reset <= 1;
                    end
                end

                PREAMBLE: begin
                    tx_en <= 1;
                    txd <= 4'b0101;       // Preamble nibble: 0101
                    crc_reset <= 0;
                    preamble_cnt <= preamble_cnt + 1;
                    if (preamble_cnt == 14)
                        state <= SFD;
                end

                SFD: begin
                    if (!nibble_sel) begin
                        txd <= 4'b0101;   // SFD low nibble
                        nibble_sel <= 1;
                    end else begin
                        txd <= 4'b1101;   // SFD high nibble (0xD5)
                        nibble_sel <= 0;
                        byte_cnt <= 0;
                        tx_byte_addr <= 0;
                        state <= DATA;
                    end
                end

                DATA: begin
                    if (!nibble_sel) begin
                        txd <= tx_data[3:0];       // Low nibble first
                        crc_data <= tx_data[3:0];
                        crc_enable <= 1;
                        nibble_sel <= 1;
                    end else begin
                        txd <= tx_data[7:4];       // High nibble
                        crc_data <= tx_data[7:4];
                        nibble_sel <= 0;
                        byte_cnt <= byte_cnt + 1;
                        tx_byte_addr <= tx_byte_addr + 1;
                        if (byte_cnt + 1 == tx_len) begin
                            state <= FCS;
                            fcs_nibble_cnt <= 0;
                            crc_enable <= 0;
                        end
                    end
                end

                FCS: begin
                    crc_enable <= 0;
                    txd <= crc_out[fcs_nibble_cnt*4 +: 4];
                    fcs_nibble_cnt <= fcs_nibble_cnt + 1;
                    if (fcs_nibble_cnt == 7) begin
                        state <= IFG;
                        ifg_cnt <= 0;
                    end
                end

                IFG: begin
                    tx_en <= 0;
                    txd <= 4'h0;
                    ifg_cnt <= ifg_cnt + 1;
                    if (ifg_cnt == 23)    // 96 bit times = 24 nibble clocks
                        state <= IDLE;
                end
            endcase
        end
    end
endmodule` },
        { type: 'text', html: `<h3>IP Header Format</h3>
<p>Inside the Ethernet payload, an IP packet begins with a 20-byte header (no options). You need to construct this correctly for every packet you send:</p>` },
        { type: 'table', headers: ['Offset', 'Size', 'Field', 'Typical Value'],
          rows: [
            ['0', '4 bits', 'Version', '4 (IPv4)'],
            ['0', '4 bits', 'IHL (header length)', '5 (= 20 bytes, no options)'],
            ['1', '1 byte', 'DSCP / ECN', '0x00'],
            ['2', '2 bytes', 'Total Length', 'Header + payload in bytes'],
            ['4', '2 bytes', 'Identification', 'Unique packet ID (for fragmentation)'],
            ['6', '2 bytes', 'Flags + Fragment Offset', '0x4000 (Don\'t Fragment)'],
            ['8', '1 byte', 'TTL (Time to Live)', '64 (decremented by each router)'],
            ['9', '1 byte', 'Protocol', '17 = UDP, 6 = TCP, 1 = ICMP'],
            ['10', '2 bytes', 'Header Checksum', 'One\'s complement sum of header words'],
            ['12', '4 bytes', 'Source IP Address', 'e.g., 192.168.1.100'],
            ['16', '4 bytes', 'Destination IP Address', 'e.g., 192.168.1.1'],
          ]
        },
        { type: 'text', html: `<h3>ARP: Address Resolution Protocol</h3>
<p>Before your system can send an IP packet to a device on the local network, it needs to know the destination's <strong>MAC address</strong>. IP addresses are logical (layer 3), but Ethernet frames need physical MAC addresses (layer 2). ARP bridges this gap.</p>
<p><strong>How ARP works:</strong></p>
<ol>
<li>Your system wants to reach IP 192.168.1.1 but does not know its MAC address.</li>
<li>It broadcasts an <strong>ARP Request</strong> (destination MAC = FF:FF:FF:FF:FF:FF): "Who has 192.168.1.1? Tell 192.168.1.100 at AA:BB:CC:DD:EE:01."</li>
<li>The device at 192.168.1.1 responds with a unicast <strong>ARP Reply</strong>: "192.168.1.1 is at AA:BB:CC:DD:EE:02."</li>
<li>Your system caches this IP-to-MAC mapping in an <strong>ARP table</strong> and can now address Ethernet frames directly.</li>
</ol>
<p>An ARP packet is 28 bytes (for IPv4/Ethernet) with EtherType 0x0806. Fields: hardware type (1 = Ethernet), protocol type (0x0800 = IPv4), hardware address length (6), protocol address length (4), operation (1 = request, 2 = reply), sender hardware/protocol address, and target hardware/protocol address. For your Ethernet controller, implement a minimal ARP responder: when a request arrives for your IP, reply with your MAC. Without this, no other device can discover you on the network.</p>` },
        { type: 'code', label: 'crc32_tb.v — Testbench with known test vectors', code: `\`timescale 1ns / 1ps

module crc32_tb;
    reg        clk;
    reg        reset;
    reg        enable;
    reg  [3:0] data_in;
    wire [31:0] crc_out;

    crc32 uut (
        .clk(clk), .reset(reset),
        .enable(enable), .data_in(data_in),
        .crc_out(crc_out)
    );

    // 25 MHz clock (40ns period)
    always #20 clk = ~clk;

    // Feed one byte as two nibbles (low nibble first per Ethernet order)
    task feed_byte(input [7:0] b);
        begin
            @(posedge clk);
            data_in <= b[3:0];   // Low nibble first
            enable  <= 1;
            @(posedge clk);
            data_in <= b[7:4];   // High nibble
        end
    endtask

    integer pass_count;
    integer fail_count;

    initial begin
        clk = 0; reset = 1; enable = 0; data_in = 0;
        pass_count = 0; fail_count = 0;

        @(posedge clk); @(posedge clk);
        reset = 0;

        // --- Test 1: CRC-32 of "123456789" ---
        // Expected: 0xCBF43926 (IEEE 802.3 check value)
        feed_byte(8'h31);  // '1'
        feed_byte(8'h32);  // '2'
        feed_byte(8'h33);  // '3'
        feed_byte(8'h34);  // '4'
        feed_byte(8'h35);  // '5'
        feed_byte(8'h36);  // '6'
        feed_byte(8'h37);  // '7'
        feed_byte(8'h38);  // '8'
        feed_byte(8'h39);  // '9'
        @(posedge clk); enable <= 0; @(posedge clk);

        if (crc_out == 32'hCBF43926) begin
            $display("PASS: test1 CRC=0x%08X", crc_out);
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: test1 CRC=0x%08X (expected CBF43926)", crc_out);
            fail_count = fail_count + 1;
        end

        // --- Test 2: Single byte 0x00 ---
        // Expected: 0xD202EF8D
        reset = 1; @(posedge clk); reset = 0;
        feed_byte(8'h00);
        @(posedge clk); enable <= 0; @(posedge clk);

        if (crc_out == 32'hD202EF8D) begin
            $display("PASS: test2 CRC=0x%08X", crc_out);
            pass_count = pass_count + 1;
        end else begin
            $display("FAIL: test2 CRC=0x%08X (expected D202EF8D)", crc_out);
            fail_count = fail_count + 1;
        end

        $display("Results: %0d passed, %0d failed", pass_count, fail_count);
        $finish;
    end
endmodule` },
        { type: 'text', html: `<h3>UDP Protocol</h3>
<p>For our network bootloader, we will use <strong>UDP</strong> (User Datagram Protocol) — the simplest transport protocol. It adds source/destination ports and a length/checksum to IP packets, with no connection setup or reliability guarantees.</p>` },
        { type: 'diagram', content: `
UDP Packet inside Ethernet:

┌──────────┬──────────┬─────────────────────────────────────┬─────┐
│ Ethernet │    IP    │              UDP                    │ FCS │
│ Header   │  Header  │  Src Port │ Dst Port │ Len │ Data  │     │
│ 14 bytes │ 20 bytes │  2 bytes  │ 2 bytes  │ 2+2 │ N     │ 4B  │
└──────────┴──────────┴─────────────────────────────────────┴─────┘

To send a UDP packet to boot our system:
  1. Construct UDP payload (our program binary)
  2. Prepend UDP header (src port, dst port, length)
  3. Prepend IP header (src IP, dst IP, protocol=17/UDP)
  4. Prepend Ethernet header (src MAC, dst MAC, type=0x0800)
  5. Append CRC-32
  6. Transmit via MAC` },
        { type: 'info', variant: 'success', title: 'Hardware + Software Milestone',
          html: '<p>With the Ethernet MAC and a UDP stack, your system can communicate over a network. Combined with the C compiler, linker, and libc you just built, you now have a complete development environment: write C code, compile it, and boot it over the network onto your custom CPU.</p>' },
        { type: 'video', id: 'XaGXPObx2Gs', title: 'Networking Fundamentals — Practical Networking' },
        { type: 'video', id: 'i8CmibhvZ0c', title: 'How Ethernet Works — Ben Eater' },
        { type: 'practice', title: 'Practice Exercises', items: [
          'Implement the CRC-32 module and test with known Ethernet frame data (many test vectors are available online)',
          'Design a simple MAC transmitter that takes a byte buffer and sends an Ethernet frame (preamble + SFD + data + CRC)',
          'Capture Ethernet traffic with Wireshark and manually decode the hex to identify all frame fields',
          'Write a simple ARP responder in C: receive an ARP request, reply with your MAC address',
          'Implement a UDP echo server: receive a UDP packet, swap source and destination, send it back',
          'Build a network bootloader: write a C program that receives a binary over UDP and loads it into RAM',
        ]},
        { type: 'resources', links: [
          { type: 'Code', title: 'Alex Forencich: Verilog Ethernet', url: 'https://github.com/alexforencich/verilog-ethernet', desc: 'Production-quality Ethernet MAC, ARP, IP, UDP in Verilog — excellent reference' },
          { type: 'Article', title: 'Reddit: Designing an Ethernet MAC', url: 'https://www.reddit.com/r/FPGA/comments/18mqmuu/designing_an_ethernet_mac/', desc: 'FPGA community discussion on Ethernet MAC design' },
          { type: 'Tutorial', title: 'fpga4fun: Ethernet on FPGA', url: 'https://www.fpga4fun.com/10BASE-T.html', desc: 'Simple 10BASE-T Ethernet on FPGA tutorial' },
          { type: 'Article', title: 'Ben Eater: Networking Tutorial Series', url: 'https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOsfm_Bc', desc: 'Visual networking fundamentals series' },
        ]},
      ],
    },
  ],
}
