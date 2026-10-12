# BASIC62 CodeLab Teacher's Guide

*BASIC62 CodeLab is the browser-based environment; BASIC62 (Binary's Accessible Syntax for Introductory Computing) is the language it teaches.*

## 1. About this guide and the language

This guide helps teachers of grades 7 to 10 (ages about 12 to 16) run lessons with BASIC62 CodeLab, a browser-based programming environment for learning BASIC62, a language that reads like BASIC and grows towards Python. It also works for older beginners, including introductory courses in upper secondary school or higher education. You need no prior experience with the language; plan about two hours with the environment and the ten built-in examples before your first lesson.

BASIC62 CodeLab is a prototype that follows BASIC62 language specification v0.1. Where this guide describes behaviour, it describes what the current build actually does, and the known limits are listed in Section 9. The [language reference](language-reference.md) is generated from the source code and lists every keyword, function and error message.

### Design ideas you can share with students

- **Readable blocks.** Every block opens with a keyword and closes with `END` and the same word: `IF ... END IF`, `WHILE ... END WHILE`, `FUNCTION ... END FUNCTION`. Indentation helps people read, but the computer does not depend on it.
- **One meaning per symbol.** `=` stores a value, `==` compares. Text and numbers never mix silently: `"5" + 5` is an error that suggests `text(5)` or `whole("5")`.
- **Names are case-sensitive, keywords are not.** `score` and `Score` are different variables, while `print`, `Print` and `PRINT` all work. Examples in this guide write keywords in capitals.
- **Lists start at 0, counting loops include both ends.** `FOR i FROM 1 TO 10` runs ten times, which matches how students count aloud.
- **Functions are honest.** A function reads global variables but cannot change them; results come back with `RETURN`. This rule makes data flow visible and removes a common source of hidden bugs.
- **Errors teach.** Every error has a code, a plain message that names the problem in the student's own code, a link to the line, and a **Why?** explanation.

### Editions

The language has an **English** and a **Spanish** edition. Keywords and built-in names change (`PRINT` / `MOSTRAR`, `length` / `longitud`), while the structure stays identical. The **EN / ES** switch converts a whole project between editions in one click. Students who speak other languages use the English edition and can write their own text, comments and documentation in any language.

## 2. Getting started

Students open the BASIC62 CodeLab link (or the `index.html` file) in any current browser on a laptop, Chromebook or tablet; nothing is installed. The first visit opens the *Grades with tests and docs* example so there is always something to run.

1. **Run a program.** Press **Run** or Ctrl+Enter. Output appears on the right; questions from `ASK` appear as a box in the output, and the student types the answer there.
2. **Open an example.** **Examples** lists ten programs. Each opens as a new project, so the student's own work is never overwritten.
3. **Start a project.** **Project → New project** gives an empty editor. Rename it in the name box at the top.
4. **Saving.** Projects save automatically in the student's browser. **Project → Open project** lists them, newest first.
5. **Handing work in.** **Project → Export project (.json)** downloads the whole project, including tests, test plan, documentation, credits and version history. Teachers load it with **Project → Import project**.
6. **Changing edition.** The **EN / ES** switch converts the code and the interface. Converting back restores the keywords and built-in names.

### Keyboard shortcuts

| Keys | Action |
| --- | --- |
| Ctrl+Enter | Run the program |
| F10 | Step over (run the next line, including whole function calls) |
| F11 | Step into (go inside a function call) |
| Shift+F11 | Step out (finish the current function) |
| F5 | Continue to the next breakpoint |
| Tab / Shift+Tab | Indent / unindent the selected lines |
| Ctrl+/ | Turn the selected lines into comments, or back |
| Enter after a block opener | Indents the next line and adds the matching `END` line |

Two cautions for the first lesson: projects live in one browser on one device, so a student who changes computer must export and import; and clearing browser data deletes projects that were not exported.

## 3. A tour of the environment

The screen has three areas: the **editor** on the left, the **stage** on the right, and the **tool tabs** along the bottom.

### Editor

- Colours mark keywords (blue), text (green), numbers (orange), built-in functions (purple), class names (teal) and comments (grey, italic).
- Click a line number to set a **breakpoint** (red dot). The running line is highlighted in yellow; an error line is underlined in red.
- The **help bar** under the editor explains whatever the cursor is on: a built-in function with its parameters, a method, a keyword, or one of the student's own functions with the purpose from its DOC block.

### Stage

- **Controls panel** for programs that create buttons, text boxes, sliders, drop-down lists and checkboxes.
- **Canvas** (600 × 400) for turtle drawing, shapes, charts and network diagrams. It appears only when a program draws; the **Canvas** button shows or hides it. The centre is (0, 0), x grows to the right and y grows upwards, as in mathematics. Moving the mouse over the canvas shows the coordinates.
- **Output** shows `PRINT` results, answers to `ASK`, tables from data tools, and error boxes with **Line** and **Why?** links. If a program runs for 5 seconds without output, CodeLab asks whether to keep running or stop.

### Tool tabs

| Tab | What students do there | Typical grade |
| --- | --- | --- |
| Debug | Step through code; see variables, memory, a trace table, class diagrams and flowcharts | 7 onwards |
| Tests | Run TEST blocks, check DOC examples, see code coverage, keep a test plan | 8 onwards |
| Docs & credits | Read the project reference built from DOC blocks, fix documentation warnings, write an About page, record sources and licences | 7 onwards |
| History | Save versions with a message, compare, restore, undo, branch, merge, tag, practise git commands | 8 onwards |
| Python | See the same program in Python and download it | 9 to 10 |
| Files | Upload CSV or text files (up to 1 MB), add sample datasets, edit data | 8 onwards |
| Reference | Search every keyword, function and method in both editions | All |

## 4. Suggested progression for grades 7 to 10

The same language serves all four grades: students meet a small core in grade 7 and add features each year, so nothing learned early is thrown away. The table is a starting point to adapt to your own syllabus and timetable.

| Grade | Big idea | Language features | Tools | Starter examples |
| --- | --- | --- | --- | --- |
| 7 | Sequence, selection, repetition | `PRINT`, `ASK`, variables, `IF ... ELSE IF ... ELSE`, `REPEAT n TIMES`, `FOR ... FROM ... TO`, turtle drawing | Run, Step over, Variables view, Why? explanations | Hello and input, Turtle star pattern |
| 8 | Decomposition and data | `FUNCTION` and `RETURN`, `WHILE`, lists, dictionaries, `FOR EACH`, text methods, screen controls, CSV data | Breakpoints, Trace table, Flowchart, first `TEST` blocks, Files, History (save and restore) | Screen controls, Data, Weather |
| 9 | Abstraction and reliability | `CLASS`, `INIT`, `SELF`, `EXTENDS`, `PARENT`, `TRY ... ON ERROR`, `FAIL`, `DOC` blocks, `EXPECT ERROR`, `WITH INPUTS` | Memory and Class diagrams, Tests with coverage and test plan, Docs checker, branches | Pets, Grades with tests and docs, Sorting |
| 10 | Systems, security and transition to Python | Network and Device classes, packets, routing, firewalls, ciphers, hashing, passwords, larger data projects | Python tab, merges with tests, tags, git console, credits and licences | Network, Security, a final project |

### Grade 7: first programs (about 10 lessons)

1. Output and text: `PRINT`, joining text with `+`, comments with `#`.
2. Input and variables: `ASK`, `whole()` and `decimal()` to turn answers into numbers.
3. Decisions: `IF ... THEN ... END IF`, comparison with `==`, `!=`, `<`, `>=`, and `AND`, `OR`, `NOT`.
4. Repetition: `REPEAT n TIMES`, then `FOR i FROM 1 TO 10` with `STEP`.
5. Turtle art: `forward`, `turn`, `pen_color`, `pen_up`; patterns from nested loops.
6. Mini project: a quiz or a drawing that responds to answers. Students step through it with F10 and explain each line to a partner.

### Grade 8: functions, lists and data (about 14 lessons)

1. Functions with parameters and `RETURN`; why functions cannot change global variables.
2. Lists (`add`, `remove`, `sort`, positions from 0) and `FOR EACH`; dictionaries for records.
3. Text methods: `upper`, `trim`, `split`, `contains`, `replace`, `is_digits` for checking input.
4. Screen controls: `button`, `input_box`, `label`, `on_click`.
5. Data: `load_csv("sample:students")`, `describe`, `where`, `sort_by`, `group_by`, `mean`, `bar_chart`.
6. First tests: one `TEST` block per function with normal and boundary cases.
7. History: save a version after each working step, with a clear message.

### Grade 9: objects, errors and documentation (about 14 lessons)

1. Classes and objects: `CLASS`, `INIT`, attributes on `SELF`, methods; the Memory view shows that two variables can point to one object.
2. Inheritance with `EXTENDS` and `PARENT.INIT(...)`; the Class diagram shows the family.
3. Errors on purpose: `FAIL "message"`, `TRY ... ON ERROR`, and tests with `EXPECT ERROR ... CONTAINS`.
4. Testing input with `WITH INPUTS [...]` and `printed()`; planning normal, boundary, error and invalid-input cases in the test plan.
5. `DOC` blocks with PURPOSE, INPUTS, RETURNS and EXAMPLE lines that CodeLab checks automatically.
6. Algorithms: bubble sort and searching, with bars and index markers in the Variables view.

### Grade 10: systems, security and Python (about 14 lessons)

1. Networks: devices, routers, IP addresses, routes, ping, packets and packet loss, DNS and requests.
2. Firewalls as classes that extend `Device`, and access policies.
3. Security: Caesar and Vigenère ciphers, frequency analysis, hashing with salt, password strength, and a slowed-down brute-force demo.
4. Collaboration habits with History: branches for features, merges that must pass the tests, tags for releases.
5. Transition: compare each program with its Python version and rewrite one project in Python.
6. Final project with tests, documentation, credits and a version history the teacher can read.

## 5. Lesson notes for the ten examples

Each example is short enough to read in one lesson and opens as a separate project, so students can change it freely. Run it once, then use the question and extension below.

| Example | Key ideas | Question to ask | Extension |
| --- | --- | --- | --- |
| Hello and input | `ASK`, `whole()`, `IF ... ELSE IF` | What happens if you type "twelve" for your age? Why? | Keep asking until the age is a number |
| Turtle star pattern | Functions with a parameter, `REPEAT`, `FOR`, `MOD` for cycling colours | Why does `turn(144)` make a star? | Draw a star with 7 points; work out the angle first |
| Grades with tests and docs | Boundaries, `FAIL`, input checking, four kinds of test | Which test fails if the pass mark changes to 45? | Add a "merit" result at 80 with its own boundary tests |
| Pets: classes and objects | `CLASS`, `INIT`, `EXTENDS`, `PARENT`, `is_a` | Why does Rex lose more energy than Milo? | Add a `Cat` class with its own method |
| Data: clean and chart student scores | Missing values, duplicates, `convert_column`, `group_by`, `bar_chart` | How many rows did cleaning remove, and was that fair? | Chart something new, such as count by grade |
| Network: routing and a firewall | Routes, ping times, packets, a `Firewall` that extends `Device`, DNS | Why can splitting a message into small packets let a word slip past the firewall? | Block a second word, then test with different packet sizes |
| Security: ciphers, hashes, passwords | Caesar, frequency analysis, hashing, salt, brute force | Why does each extra letter make the brute-force search so much longer? | Measure attempts for lengths 1 to 4 and chart them |
| Screen controls: a greeter app | `label`, `input_box`, `dropdown`, `button`, `on_click` | What does the program do while it waits for a click? | Add a slider that sets how many times the greeting repeats |
| Sorting: bubble sort step by step | Nested loops, swapping, counting steps | How many comparisons for 8 numbers? For 16? | Stop early when a pass makes no swaps; compare step counts |
| Web data: weather forecast | `get_json`, nested dictionaries and lists, `line_chart` | Where in the data is the current temperature? | Load `sample:weather/lima` and compare the two cities |

The data, network and weather examples use built-in **sample** sources (`sample:students`, `sample:home_network`, `sample:weather/madrid` and others listed in the Files tab), so they work without internet access and give every student the same data.

## 6. Teaching with the debugger and visualizations

The debugger is the best tool for teaching how programs run: ask students to **predict, then step, then explain**. Before each press of F10, the student says what will change; the highlighted line and the flashing variable confirm or correct the prediction.

### Controls

- **Step into / over / out** move one line at a time, into a function call, or to the end of the current function.
- **Step back** returns one step by replaying the program from the start with the same random numbers and typed answers. It cannot replay clicks or timers.
- **Continue** runs to the next breakpoint; **Run to cursor** runs to the line where the cursor is.
- **Conditional breakpoints:** type a condition such as `i == 7` next to a breakpoint in the Breakpoints box. The program pauses there only when the condition is TRUE, which is ideal for finding the one loop pass that goes wrong.
- **Watch:** add expressions such as `length(items)` or `items[j] > items[j + 1]`; their values update at every pause.
- **Animate** steps automatically at the chosen speed, which works well on a projector.

### Views

| View | What it shows | Good for teaching |
| --- | --- | --- |
| Variables | Every variable in every active function, with its type; changed values flash. Lists appear as cells with position numbers, and whole-number variables such as `i` and `j` appear as markers under the cells. Number lists can switch to **bars** | Off-by-one errors, list positions from 0, sorting and searching |
| Memory | Functions on the left, lists, dictionaries and objects on the right, with arrows for references | Why changing a list inside a function changes the caller's list; two names for one object |
| Trace table | One row per step: line, function and each variable, with changes highlighted; exports to CSV | The paper trace tables used in exams; homework checks |
| Classes | A class diagram with attributes, methods and inheritance arrows; built-in parents such as `Device` are dashed | Planning and explaining object-oriented designs |
| Flowchart | A flowchart of the function the cursor is in, with the current step highlighted | Linking code to flowcharts |

A useful routine for grades 7 and 8: students complete a paper trace table for a short loop, then compare it with the Trace table view and explain any difference.

## 7. Testing, documentation, credits and version history

These four habits turn a working program into one that others can trust, understand and build on. Each is built into the language or the environment, so students practise it every lesson rather than in a separate unit.

### Tests

Tests live in the same file as the code and run from the **Tests** tab or the **Run tests** button.

```
TEST "boundary at 50"
    EXPECT grade(49) == "fail"
    EXPECT grade(50) == "pass"
END TEST

TEST "impossible scores"
    EXPECT ERROR grade(101) CONTAINS "0 to 100"
END TEST

TEST "invalid input is asked again" WITH INPUTS ["abc", "150", "64"]
    EXPECT ask_score() == 64
    EXPECT length(printed()) == 2
END TEST
```

- Every failed `EXPECT` names the line and shows the values it got.
- **Show coverage in the editor** colours function lines green when the tests ran them and red when they did not.
- The **test plan** table lists each case with its function, type (normal, boundary, error, invalid input), input, expected result and linked test. Status shows passed, failed or not automated, and **Plan checks** warn about functions without tests or missing case types.

Teach the four case types explicitly: students often test only the normal case. A good grade 9 habit is to write the plan row before the test, and the test before the code.

### Documentation

A `DOC` block before a function or class describes it, and its EXAMPLE lines are checked automatically.

```
DOC
  PURPOSE: Turns a test score into a result.
  INPUTS: score (whole number from 0 to 100)
  RETURNS: "pass" or "fail"
  EXAMPLE: grade(72) -> "pass"
END DOC
```

In **Docs & credits**, the **Project reference** builds a reference page from these blocks, and the **Checker** lists what is missing: undocumented functions, parameters not mentioned in INPUTS, a missing RETURNS, or unfinished examples. **Add DOC template** inserts a block to fill in.

### Credits and licences

**Find sources used by the program** lists the sample datasets, files and web addresses the code uses. Students add what they used and the licence (own work, CC BY, CC0, open data and others). Unknown licences produce a warning, which opens a short discussion of copyright, attribution and permission. The **About** form produces a one-page description of the project for a portfolio.

### Version history

The **History** tab is a simplified, safe version of git.

1. **Save version** asks *What changed?* and *Why?* Short messages such as "fix" get a hint to be more specific.
2. Selecting a version shows its changes line by line; students can view, **restore** or **undo** it.
3. **Branches** let a student try an idea without risking working code. **Merge** brings it back; when both branches changed the same lines, the student chooses *Keep mine*, *Keep theirs*, *Keep both* or edits the result, and the merge finishes only if all tests pass.
4. **Tags** mark releases such as `v1.0`; **Push** and **Pull** use a simulated remote copy.
5. The **Git console** accepts real commands (`git status`, `git log --oneline`, `git branch`, `git merge`), and **Equivalent git commands** shows the command behind every button, which prepares students for real tools later.

## 8. Coaching students through errors

Every error box offers three levels of help, and students should use them in order: read the **message**, click **Line N** to see where, then open **Why?** for the rule behind it. Ask students to try the first two levels before calling you, and to say the error in their own words when they do.

| Code | What the student sees | Usual cause | Coaching question |
| --- | --- | --- | --- |
| E101, E109 | A block has no matching END, or END closes the wrong block | Missing `END IF` / `END FOR`, or blocks closed in the wrong order | Which block opened last? Which END should come first? |
| E106 | An IF line needs THEN at the end | Forgotten `THEN` | What separates the question from the answer? |
| E107 | To compare, use `==` | `IF x = 5 THEN` | Are you storing a value or asking a question? |
| E201 | I don't know `scroe` yet. Did you mean `score`? | Typing mistake, wrong capital letter, or a variable used before it is created | Where is this name created? Is it spelled the same? |
| E202 | You can't add text and a number | `"Age: " + 5`, or adding an `ASK` answer to a number | What type does `ASK` give you? How can you convert it? |
| E204 | A list position is outside the list | Loop that runs to `length(list)` instead of `length(list) - 1` | What is the last position of a list with 5 items? |
| E205 | The dictionary has no such key | Misspelled key, or a key that was never added | Which keys does it list? How could you check first? |
| E206 | New attribute created outside INIT | `SELF.speed = 3` in a method when `speed` was never set in INIT | Where should every attribute be created? |
| E210 | You can't divide by zero | Average of an empty list | What should the program do when there is no data? |
| E211 | A function can't change a global variable | Trying to update a score or counter from inside a function | How can the function RETURN the new value instead? |
| E213 | Too many calls inside calls | Recursion with no stopping case | Which call does not call itself again? |
| E215 | Can't turn "abc" into a whole number | Converting unchecked input | How could you check the text with `is_digits()` or use TRY? |
| E230 | IF needs TRUE or FALSE | `IF name THEN` or `WHILE count` | What comparison makes this a yes-or-no question? |
| E231 | The loop has run too many steps | A WHILE loop whose condition never changes | What inside the loop moves it towards the end? |

Two more classroom techniques work well. **Error hunts:** give a working program with three planted errors and ask students to fix them using only the error boxes. **Rubber duck:** before asking for help, a student explains the failing line, word by word, to a partner who may only ask "why?"

## 9. Bridge to Python, assessment and practical notes

### Moving to Python

The **Python** tab shows each program as standard Python, from either edition. Tests become pytest functions, DOC blocks become docstrings, and `FOR i FROM 1 TO 10` becomes `for i in range(1, 11)`, which is a good discussion of why Python stops one early. **Download** gives a zip with `main.py` and `blstudent.py`, a small helper module for data, charts, turtle shapes and security functions. The simulated network and screen controls exist only in the browser.

A grade 10 sequence that works: read the Python version of a familiar program, predict its output, run it in a Python environment, then rewrite one feature by hand.

### Assessment ideas

| Evidence | Where to find it | What it shows |
| --- | --- | --- |
| Working program | Exported project; run it | Correctness and use of the right structures |
| Tests and test plan | Tests tab | Thinking about normal, boundary, error and invalid cases |
| Documentation | Docs & credits: reference and checker | Ability to explain purpose, inputs and results |
| Version history | History tab | Working in steps, clear messages, recovery from mistakes |
| Trace table or debugger explanation | Trace table CSV, or a short screen recording | Understanding of how the program runs |
| Credits | Docs & credits | Honest attribution and awareness of licences |

A simple four-level rubric per row (beginning, developing, secure, extending) keeps marking quick. Because tests, documentation and history travel inside the exported project, one file per student holds all the evidence.

### Differentiation and accessibility

- **Support:** start from an example rather than an empty editor; use Step over and the Variables view constantly; pair students for rubber-duck explanations.
- **Stretch:** conditional breakpoints, extra boundary tests, refactoring into classes, the git console, and comparing the Python version.
- **Language:** Spanish-speaking students can work in the Spanish edition and switch to English for shared work.
- **Accessibility:** the interface uses the Atkinson Hyperlegible typeface and Fira Code for code, works with the keyboard, describes charts in text for screen readers, and respects the reduced-motion setting.

### Practical notes and known limits

- **Internet:** BASIC62 CodeLab needs a connection to open (when hosted) and to load its fonts. Programs read only the built-in `sample:` data sources and uploaded files; they cannot fetch real websites.
- **Storage:** projects are kept in each browser. Ask students to export at the end of every lesson until it becomes a habit.
- **Recursion:** functions can call themselves up to 500 levels deep.
- **Spanish edition:** `Y` and `O` must be written in capitals; results from library functions use English keys such as `"name"`; reference descriptions are in English. Converting to Spanish may also rename attributes that share a name with built-in members, for example `name` becomes `nombre`.
- **Step back** replays typed answers but not clicks or timers.

### Quick reference

| Purpose | English | Spanish |
| --- | --- | --- |
| Output and input | `PRINT`, `ASK("question")` | `MOSTRAR`, `PREGUNTAR("pregunta")` |
| Decisions | `IF ... THEN`, `ELSE IF`, `ELSE`, `END IF` | `SI ... ENTONCES`, `SINO SI`, `SINO`, `FIN SI` |
| Loops | `REPEAT n TIMES`, `FOR i FROM a TO b STEP s`, `FOR EACH x IN list`, `WHILE`, `BREAK`, `CONTINUE` | `REPETIR n VECES`, `PARA i DESDE a HASTA b CON PASO s`, `PARA CADA x EN lista`, `MIENTRAS`, `SALIR`, `CONTINUAR` |
| Functions | `FUNCTION`, `RETURN` | `FUNCIÓN`, `DEVOLVER` |
| Classes | `CLASS`, `EXTENDS`, `INIT`, `NEW`, `SELF`, `PARENT` | `CLASE`, `EXTIENDE`, `INICIAR`, `NUEVO`, `ESTE`, `PADRE` |
| Errors | `TRY`, `ON ERROR`, `FAIL` | `INTENTAR`, `SI FALLA`, `FALLAR` |
| Tests | `TEST`, `EXPECT`, `EXPECT ERROR`, `CONTAINS`, `WITH INPUTS` | `PRUEBA`, `COMPROBAR`, `COMPROBAR ERROR`, `CONTIENE`, `CON ENTRADAS` |
| Operators and values | `AND`, `OR`, `NOT`, `DIV`, `MOD`, `TRUE`, `FALSE`, `NOTHING` | `Y`, `O`, `NO`, `DIV`, `MOD`, `VERDADERO`, `FALSO`, `NADA` |

The **Reference** tab and the [language reference](language-reference.md) list all 111 built-in functions by area (core, text, turtle and drawing, screen controls, web data, data tools, network, security, testing), plus the text, list and dictionary methods, in both editions.

### Frequently asked questions

**A student's work has disappeared.** It was saved in a different browser or device, or the browser data was cleared. Check **Project → Open project** on the original device; exported files can always be imported again.

**The program seems frozen.** It is probably waiting for an answer in the output area, or for a click on a control (the status says *Waiting for clicks and keys*). Press **Stop** to end it.

**Can students share projects?** Yes, by exporting the .json file and importing it on another device. There is no live collaboration inside BASIC62 CodeLab.

**Why can't a function change my score variable?** This is a deliberate rule (E211). Pass the value in as a parameter and RETURN the new value.
