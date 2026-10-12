# BASIC62 CodeLab: An Introduction for Teachers and IT Coordinators

*BASIC62 CodeLab is the browser-based environment; BASIC62 (Binary's Accessible Syntax for Introductory Computing) is the language it teaches.*

BASIC62 CodeLab is a browser-based programming environment for students aged about 12 to 16. It teaches BASIC62, a modern, beginner-friendly language that reads as easily as classic BASIC and grows towards Python. One tool covers four school years, from a first `PRINT` statement to classes, data, networks and the move to Python, with nothing to install.

## The language in brief

The language is designed for one specific gap: the step from block-based programming to "real" text code. Students write text from the first day, but with syntax that reads almost like plain English:

```
FOR i FROM 1 TO 5
    IF i MOD 2 == 0 THEN
        PRINT i, "is even"
    END IF
END FOR
```

Three principles define it:

- **Readable structure.** Every block is closed explicitly (`END IF`, `END FOR`), as in structured BASIC dialects. Indentation helps the reader, but it is not a rule that breaks the program, as it is in Python.
- **Flexibility that grows with the student.** Types are inferred automatically, as in Python. The same language covers lists, dictionaries, classes and inheritance, data analysis, apps with buttons, networks and cybersecurity, so there is no need to change tools every year.
- **Rules that teach.** Some choices are deliberately stricter than in professional languages: text and numbers never mix silently, and a function cannot quietly change global variables. Every error is explained in plain language, with the line and the rule that was broken.

Keywords exist in an English and a Spanish edition, and a project converts from one to the other in one click. Students who speak other languages use the English edition and can write their own text, comments and documentation in any language.

## How it compares with familiar languages

BASIC62 does not replace Scratch or Python; it bridges the distance between them. The table gives a brief, general picture.

| | Scratch | Classic BASIC | Python | BASIC62 in CodeLab |
| --- | --- | --- | --- | --- |
| Form | Blocks that snap together | Text, often with line numbers and `GOTO` | Text | Text, English or Spanish keywords |
| First contact | Very easy, no syntax errors | Easy for short programs | Easy for a few lines; indentation matters | Easy; blocks with an explicit end, no type declarations |
| Range | Games, animations, stories | Arithmetic, text, simple graphics (varies by dialect) | Almost anything, through libraries | Algorithms, graphics, apps, objects, data, networks, security, tests |
| Error messages | Few, because blocks only fit correctly | Short codes in many dialects | Technical for beginners | Plain language, with the line and a "why" explanation |
| Seeing execution | Watch sprites move | Depends on the environment | With extra tools | Built in: variables, memory, trace table, flowcharts and class diagrams |
| Next step | Move to a text language | Move to a modern language | Professional use | Python, with every program translated automatically |

### Flexibility in practice

- **One language across four years.** A grade 7 student starts with `PRINT` and loops; by grade 10 the same student writes classes, analyses data and simulates networks, without forgetting what came before and without changing tools.
- **Compatible with what is already taught.** Students coming from Scratch recognise the same ideas (repetition, conditions, events, turtle graphics), and the explicit block endings are familiar to teachers who learned structured BASIC or Pascal-style pseudocode.
- **A smooth move to Python.** Every program is also shown in Python, with tests as pytest functions and documentation as docstrings. Students compare two versions of a program they already understand.
- **Professional habits from the start.** Tests, documentation, credits and version history (a simplified git) are part of the language and the environment, not separate tools for later.

## What teachers gain

- **Less time on syntax, more on thinking.** Error messages point to the line and suggest a fix, so students solve most problems themselves before asking for help.
- **Execution becomes visible.** With step-by-step execution, breakpoints and visualizations, students see what happens to variables and memory. The trace table matches the paper trace tables used in many exams.
- **Ready-made material for every grade.** Ten examples, from a first program to networks and security, open in one click. The sample data is built in, so every student works with the same data and no external services are needed.
- **Assessment evidence in one file.** A student hands in one project file containing the code, tests, documentation, sources and version history. You see the process, not only the result.
- **Guides included.** The [Teacher's Guide](teacher-guide.md) has a suggested progression by grade, lesson notes and assessment ideas, and the [Student Guide](student-guide.md) is written for students to use on their own.

## Tools and features available to students

Everything below lives in one web page, with no add-ons. The first table lists the tools of the environment; the second lists what the language itself can do. The full list of functions is in the [language reference](language-reference.md).

### In the environment

| Area | What students can do |
| --- | --- |
| Projects | Several projects with automatic saving, 10 ready-made examples, duplicate a project, export and import a .json file, switch between the English and Spanish editions in one click |
| Code editor | Syntax colouring, line numbers, automatic indentation and automatic closing of blocks with `END`, indenting a selection with Tab, comments with Ctrl+/, a help bar for whatever is under the cursor |
| Running and output | Run and Stop, `ASK` questions inside the output, data tables, error messages with a code, a link to the line and a **Why?** explanation, a warning when a loop seems never to end |
| Stage | A canvas with a turtle, shapes, text and mouse coordinates, charts, network diagrams with moving packets, and screen controls (buttons, text boxes, sliders, drop-down lists, checkboxes) |
| Debugging | Step into, over, out and back, Continue, Run to cursor, automatic stepping at a chosen speed, breakpoints and conditional breakpoints, watched expressions, call stack |
| Visualizations | Variables (lists as cells with index markers or as bars), Memory (references drawn as arrows), Trace table (exports to CSV), class diagram, flowchart |
| Tests | Run `TEST` blocks, automatic checking of `DOC` examples, code coverage shown in the editor, a test plan with case types and warnings about what is missing |
| Documentation and credits | A project reference page built from `DOC` blocks, a documentation checker, a one-click `DOC` template, an About page, a table of sources with licences, and automatic detection of the sources the code uses |
| History | Save versions with "what" and "why", line-by-line changes, view, restore and undo versions, branches, merging with conflict resolution that completes only if the tests pass, tags, push and pull to a simulated remote copy, optional staging, a git console and the equivalent git command for every action |
| Python | Automatic translation of every program, copy, and download of a zip file with the code and a small helper module |
| Files | Upload CSV or text files (up to 1 MB), add sample datasets, edit data with a table preview |
| Reference | Search all keywords, functions, methods and classes, with names in both editions |

### In the language

| Area | What it includes |
| --- | --- |
| Structures | Variables, `IF / ELSE IF / ELSE`, `REPEAT`, `FOR` with `STEP`, `FOR EACH`, `WHILE`, `BREAK`, `CONTINUE`, functions with default parameter values, lists and list slices, dictionaries, classes with inheritance, `TRY / ON ERROR`, `FAIL` |
| Core functions | Input and conversion (`ASK`, `whole`, `decimal`, `text`), maths (`round`, `sqrt`, `abs`, `min`, `max`, `sum`), random numbers, time, step counting |
| Text | More than 20 methods (case, trimming, splitting, searching, replacing, checking for digits or letters), joining, number formatting |
| Turtle and drawing | Movement and turning, colours and pen size, circles, rectangles, lines, text, clearing; timers, keys and mouse for games |
| Screen controls | Buttons, labels, text and number boxes, sliders, drop-down lists, checkboxes, click and change events |
| Web data | Reading and sending JSON and text, with built-in samples (weather, countries, quiz questions) that work offline |
| Data tools | Loading and saving CSV, describing, filtering, sorting, grouping, statistics (mean, median, mode, standard deviation), cleaning (duplicates, missing values, column conversion), text analysis; bar, line, scatter charts and histograms |
| Networks | A simulated network with devices, routers and servers, IP addresses, DNS, routes, ping, packets with loss and resending, requests, logs; your own firewalls as classes, and access policies |
| Security | Caesar and Vigenère ciphers, frequency analysis, hashing with salt, checksums, password strength checks, a brute-force demonstration, simplified public-key encryption |
| Testing | `TEST`, `EXPECT`, `EXPECT ERROR ... CONTAINS`, `WITH INPUTS` to simulate user answers, checking what was printed |
| Documentation | `DOC` blocks with purpose, inputs, result, attributes, errors and examples that are checked automatically |

In total the language has 111 built-in functions and 3 ready-made classes for networks and security. Students do not need to learn them all: the progression in the Teacher's Guide introduces them gradually.

## For the IT coordinator

| Topic | What applies |
| --- | --- |
| Installation | None. A single web page (`index.html`) opened from a link or a local file, with no plug-ins and no administrator rights |
| Devices | A current browser on a computer, Chromebook or tablet; the layout also adapts to small screens |
| Internet | Needed to load the page when hosted online and to load the web fonts (the app falls back to system fonts without them). Student programs do not contact external websites; they use only built-in sample data and files the student uploads (up to 1 MB) |
| Storage | Projects are stored locally, in the browser on each device. They are moved and archived by exporting and importing a .json file |
| Shared computers | The next user of the same browser profile can see the previous user's projects, and clearing browser data deletes them. Exporting at the end of each lesson is recommended |
| File downloads | Project file (.json), trace table (.csv) and Python code (.zip), always after the user confirms |
| Accessibility | A highly legible typeface, full keyboard use, text descriptions of charts for screen readers, and respect for the reduced-motion setting |

### Current status

BASIC62 CodeLab is a **prototype** (BASIC62 language specification v0.1), released as free and open-source software under the MIT License. The language engine passes 149 automated tests, the generated Python code has been checked with pytest, and all examples have been tested in a browser. These are software tests; the educational effectiveness of BASIC62 has not yet been evaluated in classrooms.

Known limits:

- the interface is available in English and Spanish only;
- there is no live collaboration between students inside the tool; sharing works by exchanging project files;
- stepping back in the debugger does not replay clicks and timers.

To get started, a school needs the BASIC62 CodeLab link (or the `index.html` file), the Teacher's Guide and the Student Guide.
