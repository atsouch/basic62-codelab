# BASIC62 CodeLab Student Guide

*BASIC62 CodeLab is the browser-based environment; BASIC62 (Binary's Accessible Syntax for Introductory Computing) is the language it teaches.*

## 1. Welcome

With this guide you will write your first programs, draw with a "turtle", build small apps with buttons, and learn to find and fix mistakes like a professional. You do not need to know anything about programming yet.

You will work in **BASIC62 CodeLab**, an environment that opens in your web browser with nothing to install, and write programs in **BASIC62**, a language designed to be easy to read, almost like plain English:

```
IF score >= 10 THEN
    PRINT "You passed!"
END IF
```

Three things to remember from the start:

- Every block that opens is closed with `END` and the same word: `IF ... END IF`, `REPEAT ... END REPEAT`.
- Text inside quotation marks and comments can be written in any language you like.
- Mistakes are part of the job. CodeLab explains every mistake and shows you where it is.

## 2. Your first program

1. Open the **Project** menu and choose **New project**. Give your project a name in the box at the top.
2. Type this in the editor:

```
name = ASK("What is your name?")
PRINT "Hello, " + name + "!"
```

3. Press **Run** or Ctrl+Enter.
4. The question appears in the **Output** area. Type your name and press Enter.

`ASK` asks a question and waits for an answer. `PRINT` shows something in the output. `+` joins pieces of text.

### Get to know the screen

| Area | What it does |
| --- | --- |
| Editor (left) | Where you write code. Colours help you: blue for keywords, green for text, orange for numbers, grey for comments |
| Help bar (under the code) | Explains the word your cursor is on |
| Canvas (right) | Appears when your program draws |
| Output (right) | Results, questions and error messages |
| Tabs (bottom) | Debug, Tests, Docs & credits, History, Python, Files, Reference |

### Saving and handing in

- Your project saves **automatically**, but only in this browser, on this computer.
- To take it to another computer or hand it in, choose **Project → Export project (.json)**. To open it again: **Project → Import project**.
- Want to see finished programs? The **Examples** menu has ten. Each example opens as a new project, so your own work is safe.

## 3. Language basics

Every example here has been tested. Copy it, press **Run**, then change it to see what happens.

### Variables, text and numbers

A **variable** is a labelled box that holds a value. `=` puts a value in the box.

```
age = 13
height = 1.62
name = "Elena"
PRINT name, "is", age, "years old"
PRINT "In 5 years: " + text(age + 5)
PRINT 7 DIV 2, 7 MOD 2, 7 / 2
```

- Names are case-sensitive: `age` and `Age` are different boxes. Choose names that say what they hold, for example `score` rather than `x`.
- Text and numbers cannot be added together: write `text(age)` to turn a number into text, or `whole(answer)` to turn an answer into a whole number.
- `DIV` gives the whole-number part of a division (7 DIV 2 = 3) and `MOD` gives the remainder (7 MOD 2 = 1).
- Anything after `#` is a **comment**: the computer ignores it, people read it.

### Decisions with IF

```
score = whole(ASK("Score (0-20)?"))
IF score >= 18 THEN
    PRINT "Excellent!"
ELSE IF score >= 10 THEN
    PRINT "You passed."
ELSE
    PRINT "Not this time."
END IF
```

To compare, write `==` (equal), `!=` (not equal), `<`, `>`, `<=`, `>=`. A single `=` **stores** a value; it does not ask a question. Combine questions with `AND`, `OR` and `NOT`.

### Repeating with loops

```
REPEAT 3 TIMES
    PRINT "Hi!"
END REPEAT

FOR i FROM 1 TO 5
    PRINT i, "x 7 =", i * 7
END FOR

n = 1
WHILE n < 100
    n = n * 2
END WHILE
PRINT n
```

- `REPEAT` when you know how many times.
- `FOR` when you need a counter. `FOR i FROM 1 TO 5` counts 1, 2, 3, 4, 5 (both ends count). With `STEP -5` you count down.
- `WHILE` when you repeat **as long as** something is true. Careful: something inside the loop must change, or it will never stop.

### Lists and dictionaries

```
fruits = ["apple", "banana", "cherry"]
fruits.add("fig")
PRINT fruits[0], length(fruits)
FOR EACH f IN fruits
    PRINT "I like", f
END FOR

student = {"name": "Nick", "grade": 8}
student["grade"] = 9
PRINT student["name"], student["grade"]
```

- A **list** holds many values in order. The first position is **0**, so in a list of 4 items the last position is 3.
- A **dictionary** holds "key: value" pairs, like a student record card.

### Functions

A **function** is a named recipe you can use as many times as you like.

```
FUNCTION area(width, height)
    RETURN width * height
END FUNCTION

PRINT area(3, 4)
```

A function gets values through its **parameters** and gives a result back with `RETURN`. It can **read** variables from the main program but **cannot change** them: if you try, an error message tells you to return the new value with `RETURN` instead.

## 4. Drawing with the turtle

The **turtle** is an arrow on the canvas that holds a pen. Wherever it goes, it leaves a line.

```
pen_color("blue")
pen_size(3)
REPEAT 4 TIMES
    forward(100)
    turn(90)
END REPEAT

fill_color("gold")
circle(0, 0, 40)
write(-100, 150, "My drawing")
```

| Command | What it does |
| --- | --- |
| `forward(100)` / `back(50)` | Moves forward or back that many steps |
| `turn(90)` | Turns right that many degrees (a negative number turns left) |
| `pen_up()` / `pen_down()` | Lifts or lowers the pen |
| `go_to(x, y)` | Goes to a point |
| `pen_color("red")`, `pen_size(4)` | Line colour and thickness |
| `fill_color("gold")` | Fill colour for circles and rectangles |
| `circle(x, y, r)`, `rect(x, y, w, h)`, `line(x1, y1, x2, y2)` | Shapes at a given position |
| `write(x, y, "text")` | Writes text on the canvas |
| `clear()`, `hide_turtle()` | Clears the canvas, hides the turtle |

The canvas is 600 wide and 400 high. The centre is (0, 0), x grows to the right and y grows **upwards**, as in maths. Move the mouse over the canvas to see the coordinates.

**Tip:** for a regular polygon with N sides, the turtle turns 360 / N degrees at each corner. Try N = 3, 5, 6 and 36. What do you notice?

Want something that moves? `every(0.1, move)` calls the function `move` every 0.1 seconds, and `on_key("left", go_left)` reacts to the left arrow key. With these you can build small games.

## 5. When something goes wrong

No programmer writes code without mistakes. Good programmers know how to **find** them.

### Read the error message in three steps

1. **Read the message.** It says what the problem is, using words from your own code.
2. **Click Line N.** The cursor jumps to the line with the problem, which is underlined in red.
3. **Click Why?** to see the rule that was broken.

Before asking for help, try to say the error in your own words. Often that is enough to solve it.

### The most common mistakes

| The message says (roughly) | What it means | What to try |
| --- | --- | --- |
| I don't know `scroe` yet. Did you mean `score`? | The name does not exist, usually a typing mistake or a capital letter | Check the spelling; `Score` is not `score` |
| ... has no matching `END IF` | A block was not closed | Find which `IF`, `FOR` or `WHILE` is missing its `END` |
| An `IF` line needs `THEN` at the end | You forgot `THEN` | Add it at the end of the line |
| To compare, use `==` | You wrote `IF x = 5` | Write `IF x == 5` |
| You can't add text and a number | For example `"Age: " + 13` | Write `"Age: " + text(13)` |
| A list position is outside the list | You asked for a position that does not exist | Remember: the last position is `length(list) - 1` |
| Inside a function you can read `count` but not change it | The function tried to change a variable of the main program | Return the new value with `RETURN` |
| `whole` can't turn "abc" into a whole number | The answer was not a number | Check with `.is_digits()` or use `TRY` |

If a program runs for 5 seconds without showing anything, CodeLab asks whether it should keep going. That usually means a `WHILE` loop that never stops.

### Catch errors before they catch you: TRY

```
TRY
    n = whole(ASK("A number:"))
    PRINT 100 / n
ON ERROR
    PRINT "Something went wrong. Try again."
END TRY
```

## 6. Debugging with the CodeLab tools

Debugging means finding out **why** a program does something different from what you expected. The tools in the **Debug** tab let you look inside your program while it runs, instead of guessing.

### The method in four steps

1. **Reproduce.** Find which values make the mistake appear. Write down what you expected and what you got.
2. **Locate.** Put a breakpoint where you suspect the problem starts.
3. **Observe.** Step through the code and, before each step, predict what will change. The first value that is not what you expected is your clue.
4. **Fix and confirm.** Fix it, run again, and add a `TEST` so the same mistake never comes back.

### The Debug buttons

| Button | Key | What it does | When I use it |
| --- | --- | --- | --- |
| **Step over** | F10 | Runs the next line; a function call runs completely | To move quickly through the main program |
| **Step into** | F11 | Goes inside the function being called | When I suspect the mistake is inside the function |
| **Step out** | Shift+F11 | Finishes the current function and stops where it was called | When I went into a function I know works |
| **Step back** | | Goes back one step | When I went past the moment I wanted to see |
| **Continue** | F5 | Runs to the next breakpoint | To jump from stop to stop |
| **Run to cursor** | | Runs to the line where the cursor is | To get straight to a line without a breakpoint |
| **Animate** and **Speed** | | Steps by itself at the speed you choose | To "watch the film" of a loop or a sort |

The **yellow** line in the editor is the line that will run next, not the one that just ran. **Step back** replays the program with the same answers you typed, but not clicks or timers. **Stop** in the top bar stops everything.

### Breakpoints

- Click a **line number**: a red dot appears. With **Run**, the program stops before running that line. Click again and the dot disappears.
- The **Breakpoints** box (on the right) lists all breakpoints. × removes one, and the **Line N** link takes you to the line.
- **Conditional breakpoint:** type a condition in the box next to it, and the dot turns orange. The program stops only when the condition is TRUE.

```
total = 0
FOR i FROM 1 TO 100
    total = total + i
END FOR
PRINT total
```

Put a breakpoint on line 3 with the condition `i == 57`. Instead of pressing F10 two hundred times, the program stops straight away with `i` = 57 and `total` = 1596.

### Watch an expression

In the **Watch** box, type an expression and press **Add**. Its value updates at every stop. Useful expressions:

- `numbers[i]`: which item of the list am I looking at now?
- `total / length(numbers)`: what would the average be right now?
- `items[j] > items[j + 1]`: will there be a swap at this step?

If an expression cannot be worked out yet (for example, the variable does not exist), you see the error message instead of a value.

### The views

| View | What you see | What to look for |
| --- | --- | --- |
| **Variables** | Every variable with its value and type. At the top, in yellow, the function running now | Any value that changes flashes. Lists appear as boxes with their position numbers, and index variables (like `i`, `j`) appear under the box they "point" to. The **bars** button shows a list of numbers as a bar chart |
| **Memory** | On the left the functions and their variables, on the right the lists, dictionaries and objects, with arrows | Two arrows to the same box mean two names point to the same data |
| **Trace table** | One row for each step: line number, function, variable values | Changed cells are coloured. Clicking a line number takes you to the code. **Export CSV** downloads the table |
| **Classes** | The diagram of your classes, with attributes, methods and inheritance arrows | Is an attribute missing? It probably was not created in `INIT` |
| **Flowchart** | The flowchart of the function the cursor is in, with the current step in yellow | Follow the "yes" and "no" arrows to see which branch the program takes |

The **Call stack** box shows which functions are "waiting" for each other, with the current one first. Clicking a name takes you to its line.

Try this with the Memory view open:

```
a = [1, 2, 3]
b = a
b.add(4)
PRINT a
```

It prints `[1, 2, 3, 4]`, because `b = a` does not make a copy: both arrows point to the same list. For a copy, write `b = copy(a)`.

### Worked example: the average that comes out wrong

```
FUNCTION average(numbers)
    total = 0
    FOR i FROM 1 TO length(numbers) - 1
        total = total + numbers[i]
    END FOR
    RETURN total / length(numbers)
END FUNCTION

marks = [12, 15, 18]
PRINT average(marks)
```

1. **Reproduce.** I expected 15. The program prints **11.0**.
2. **Locate.** I put a breakpoint on line 4 (`total = total + numbers[i]`) and press **Run**.
3. **Observe.** At the first stop, in **Variables**, the marker `i` is under box **1**, not 0. In **Watch**, `numbers[i]` shows 15. So the 12, in position 0, is never added.
4. **Fix.** Positions start at 0, so I write `FOR i FROM 0 TO length(numbers) - 1`. Now it prints 15.0.
5. **Confirm.** I add a test so the mistake cannot come back:

```
TEST "average"
    EXPECT average([12, 15, 18]) == 15
    EXPECT average([7]) == 7
END TEST
```

### Find the bug yourself

Each of these programs runs without an error message but gives the wrong answer. Use breakpoints, Watch and Variables to find out why.

```
FUNCTION biggest(numbers)
    best = 0
    FOR EACH x IN numbers
        IF x > best THEN
            best = x
        END IF
    END FOR
    RETURN best
END FUNCTION
PRINT biggest([-5, -2, -9])
```

We expect -2, but it prints 0. *Hint: watch `best` before the first comparison. Could a negative number ever be bigger than it?*

```
FUNCTION count_vowels(word)
    count = 0
    FOR EACH ch IN word
        IF ch IN "aeiou" THEN
            count = count + 1
        END IF
    END FOR
    RETURN count
END FUNCTION
PRINT count_vowels("Apple")
```

We expect 2, but it prints 1. *Hint: add `ch IN "aeiou"` to Watch and see what happens with the first letter.*

When you find the fix, write a `TEST` for each function with the case that broke it.

### More tools that help

- **Help bar:** put the cursor on a function to see which parameters it needs.
- **Code coverage:** in the **Tests** tab, **Show coverage in the editor** colours red the lines that no test ran. Bugs you have not seen often hide there.
- **History:** if something worked yesterday and not today, select the versions after the last good one, one at a time, and see what changed in each.
- **PRINT:** a temporary `PRINT "here", x` is quick, but remember to delete it afterwards.

### Checklist when you are stuck

- [ ] I read the whole error message and clicked **Why?**
- [ ] I know which value I expected and which I got.
- [ ] I set a breakpoint and stepped through, predicting before each step.
- [ ] I checked the edges: first and last position, 0, an empty list, negative numbers.
- [ ] I compared with the last version that worked in **History**.
- [ ] I explained the code aloud to someone, line by line.

## 7. Tests, documentation and saving versions

A program that "probably works" is not enough. These three tools help you **prove** it works, **explain** what it does and **never lose** good work.

### Write tests (TEST)

A test asks the computer: "Does my function give the right result?"

```
FUNCTION area(width, height)
    RETURN width * height
END FUNCTION

TEST "area"
    EXPECT area(3, 4) == 12
    EXPECT area(0, 5) == 0
END TEST
```

Press **Run tests**. The **Tests** tab shows ✓ for tests that passed and ✗ for those that failed, with the line and the value that came out. Think of four kinds of case:

| Kind | Example for a score from 0 to 20 |
| --- | --- |
| Normal | 15 |
| Boundary (at the edges) | 0, 9, 10, 20 |
| Error | 25 should produce an error: `EXPECT ERROR grade(25)` |
| Invalid input | "abc" when the program asks for a number: `WITH INPUTS ["abc", "12"]` |

Most mistakes hide at the **edges**. If the pass mark is 10, test 9 and 10.

### Explain your code (DOC)

Before a function, write a `DOC` block.

```
DOC
  PURPOSE: Works out the area of a rectangle.
  INPUTS: width (number), height (number)
  RETURNS: the area
  EXAMPLE: area(3, 4) -> 12
END DOC
```

CodeLab **checks** the EXAMPLE lines. In the **Docs & credits** tab, the **Checker** tells you what is missing, and **Add DOC template** writes a template for you to fill in. That is also where you record your **sources** (Credits): which data or material you used and under which licence. Using other people's work without saying so is not right, even when it is easy.

### Save versions (History)

In the **History** tab, every time something works:

1. In **What changed?**, write what you changed, for example "Added a check for scores above 20". Not just "changes".
2. In **Why?**, write why you did it (optional).
3. Press **Save version**.

If something breaks, select an older version and press **Restore this version**. Want to try a wild idea? Create a new branch in the **New branch** box, work there and, if it works, merge it. The merge only finishes if all the tests pass.

## 8. For more advanced students

When the basics feel easy, the same language takes you much further.

### Apps with buttons

```
name_box = input_box("Your name")
go = button("Greet me")
answer = label("")

FUNCTION greet()
    answer.text = "Hello, " + name_box.value + "!"
END FUNCTION

on_click(go, greet)
```

The program creates the controls and then **waits**. Every click on the button calls `greet`. There are also `number_box`, `slider`, `dropdown` and `checkbox`.

### Classes and objects

A **class** is a mould, and **objects** are what you make with it. All attributes are created in `INIT`.

```
CLASS Pet
    INIT(name)
        SELF.name = name
        SELF.energy = 5
    END INIT
    FUNCTION play()
        SELF.energy = SELF.energy - 2
    END FUNCTION
END CLASS

CLASS Dog EXTENDS Pet
    INIT(name, breed)
        PARENT.INIT(name)
        SELF.breed = breed
    END INIT
    FUNCTION fetch()
        SELF.play()
        RETURN SELF.name + " brings back the ball!"
    END FUNCTION
END CLASS

rex = NEW Dog("Rex", "collie")
PRINT rex.fetch(), rex.energy
```

`Dog EXTENDS Pet` means every dog is also a pet and inherits everything `Pet` has. Open **Debug → Classes** for the diagram and **Memory** to see the objects in memory.

### Data

```
rows = load_csv("sample:students")
PRINT length(rows), "rows"
top = sort_by(rows, "score", "desc")
show_table(top[0:5])
```

Real data is "messy": values are missing, rows are duplicated, numbers are written as text. With `describe`, `dedupe`, `drop_missing` and `convert_column` you clean it, with `where`, `group_by` and `mean` you analyse it, and with `bar_chart` or `line_chart` you show it. You can also upload your own CSV file in the **Files** tab. Always ask: what was left out when I cleaned the data, and did that change my conclusion?

### Networks

```
net = load_network("sample:home_network")
PRINT net.route("laptop", "school.example")
PRINT net.ping("laptop", "school_server"), "ms"
```

A simulated network shows how a message is split into packets, which route it follows from router to router, and what happens when packets are lost. In the **Network** example you also build your own firewall.

### Security

```
secret = caesar("Meet at the library", 3)
PRINT secret
PRINT caesar(secret, -3)
PRINT hash_text("password123")
```

You will try encryption, hashing, checking password strength with `password_strength`, and a slow demonstration of how weak passwords are "cracked". The Caesar and Vigenère ciphers change only Latin letters. One rule with no exceptions: use these tools **only** on your own data inside CodeLab, never on other people's accounts or systems.

### Python

The **Python** tab shows the same program in Python, a language you will meet later. Compare the two: `FOR i FROM 1 TO 5` becomes `for i in range(1, 6)`. Why 6 and not 5?

## 9. Challenges

Choose your level and tick the challenges you complete. For each one: plan on paper first, then write code, then test with different values.

### Level 1: getting started

- [ ] Ask for the user's name and favourite team and print a sentence with both.
- [ ] Ask for two numbers and print their sum, difference, product and quotient.
- [ ] Print the 9 times table with a `FOR` loop.
- [ ] Draw a triangle, a hexagon and a star with the turtle.
- [ ] Make a three-question quiz that counts the correct answers.

### Level 2: moving on

- [ ] Write a function `bigger(a, b)` that returns the larger number, with a `TEST` that includes the case `a == b`.
- [ ] Keep a class's scores in a list and work out the average, highest and lowest.
- [ ] Ask for a password until it has at least 8 characters and a digit.
- [ ] Build an app with a button that converts Celsius to Fahrenheit.
- [ ] Load `sample:students` and find the average per grade with `group_by` and `mean`.
- [ ] Save at least three versions in History, with messages that explain what changed.

### Level 3: exploring

- [ ] Build a `BankAccount` class with `deposit` and `withdraw` that refuses a withdrawal larger than the balance with `FAIL`, and test it with `EXPECT ERROR`.
- [ ] Improve bubble sort so it stops early, and compare the steps with `steps()`.
- [ ] In the Network example, block a second word in the firewall and try different packet sizes. When does the firewall fail?
- [ ] Count how many attempts the brute-force demo needs for passwords of length 1, 2 and 3, and make a chart.
- [ ] Document every function with `DOC` until the Checker shows no warnings.
- [ ] Read the Python version of one of your programs and rewrite one of its functions in Python by hand.

## 10. Good habits, vocabulary and quick reference

### Ten good habits

1. Write a little and run often. Five lines and **Run** beats fifty lines and a big mystery.
2. Use names that explain: `total_score` rather than `t`.
3. Indent inside every block. Tab does it for you.
4. Write a `#` comment for every part that is not obvious.
5. Before you press F10, predict what will happen.
6. For every function, a `TEST` with a normal and a boundary case.
7. Save a version in **History** every time something works.
8. **Export project** at the end of every lesson.
9. Record in **Credits** where you got data or ideas.
10. When you are stuck, explain the code aloud to someone, line by line.

### Vocabulary

| Term | In BASIC62 |
| --- | --- |
| variable | `score = 0` |
| output / input | `PRINT`, `ASK` |
| condition | `IF score >= 10 THEN` |
| loop | `REPEAT`, `FOR`, `WHILE` |
| list | `[1, 2, 3]` |
| dictionary | `{"name": "Nick"}` |
| function, parameter | `FUNCTION area(width, height)` |
| return value | `RETURN` |
| class, object | `CLASS`, `NEW` |
| inheritance | `EXTENDS` |
| test | `TEST`, `EXPECT` |
| breakpoint | red dot on a line number |
| debugging | **Debug** tab |
| version, branch, merge | **History** tab |

### Quick reference

| I want to... | I write |
| --- | --- |
| show something | `PRINT "Hello", name` |
| ask the user | `answer = ASK("Question?")` |
| turn an answer into a number | `whole(answer)` or `decimal(answer)` |
| turn a number into text | `text(42)` |
| make a decision | `IF ... THEN ... ELSE IF ... ELSE ... END IF` |
| repeat n times | `REPEAT n TIMES ... END REPEAT` |
| count | `FOR i FROM 1 TO 10 ... END FOR` |
| go through a list | `FOR EACH x IN list ... END FOR` |
| repeat while something is true | `WHILE ... END WHILE` |
| leave a loop | `BREAK` |
| find the length | `length(list)` |
| make a random number | `random(1, 6)` |
| define a function | `FUNCTION name(a, b) ... RETURN ... END FUNCTION` |
| catch an error | `TRY ... ON ERROR ... END TRY` |
| write a test | `TEST "name" ... EXPECT ... END TEST` |

For every command, open the **Reference** tab and type what you are looking for. And remember the help bar under the code: put your cursor on a word and it tells you what it does.
