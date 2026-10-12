// ===== Samples =====
const SAMPLES = { web: {}, csv: {}, data: {}, networks: {}, examples: [] };
(function () {
  const hours = Array.from({ length: 24 }, (_, i) => `2026-09-24T${String(i).padStart(2, '0')}:00`);
  const cities = {
    athens: { lat: 37.98, lon: 23.73, t: 24.6, w: 11.2, code: 1, base: 21, amp: 6 },
    madrid: { lat: 40.42, lon: -3.7, t: 22.1, w: 8.4, code: 2, base: 17, amp: 8 },
    lima: { lat: -12.05, lon: -77.04, t: 17.3, w: 14.0, code: 3, base: 16, amp: 3 },
    london: { lat: 51.51, lon: -0.13, t: 15.8, w: 19.5, code: 61, base: 13, amp: 4 }
  };
  SAMPLES.web.weather = {
    desc: 'Open-Meteo style forecast. Try sample:weather/madrid, /lima or /london.',
    json: (path) => {
      const key = (path || '').replace(/^\//, '').toLowerCase() || 'athens';
      const c = cities[key] || cities.athens;
      return {
        latitude: c.lat, longitude: c.lon, timezone: 'auto', city: cities[key] ? key : 'athens',
        current: { time: '2026-09-24T12:00', temperature_2m: c.t, wind_speed_10m: c.w, weather_code: c.code },
        hourly: { time: hours, temperature_2m: hours.map((_, i) => Math.round((c.base + c.amp * Math.sin((i - 9) / 24 * 2 * Math.PI)) * 10) / 10) }
      };
    }
  };
  SAMPLES.web.countries = { desc: 'Twelve countries with capital, population, region and languages.', json: [
    { name: 'Greece', capital: 'Athens', population: 10400000, region: 'Europe', languages: ['Greek'] },
    { name: 'Spain', capital: 'Madrid', population: 48300000, region: 'Europe', languages: ['Spanish', 'Catalan', 'Galician', 'Basque'] },
    { name: 'Peru', capital: 'Lima', population: 34000000, region: 'Americas', languages: ['Spanish', 'Quechua', 'Aymara'] },
    { name: 'Mexico', capital: 'Mexico City', population: 129000000, region: 'Americas', languages: ['Spanish'] },
    { name: 'Oman', capital: 'Muscat', population: 5100000, region: 'Asia', languages: ['Arabic'] },
    { name: 'Hungary', capital: 'Budapest', population: 9600000, region: 'Europe', languages: ['Hungarian'] },
    { name: 'Rwanda', capital: 'Kigali', population: 14100000, region: 'Africa', languages: ['Kinyarwanda', 'English', 'French', 'Swahili'] },
    { name: 'Japan', capital: 'Tokyo', population: 124000000, region: 'Asia', languages: ['Japanese'] },
    { name: 'Canada', capital: 'Ottawa', population: 40100000, region: 'Americas', languages: ['English', 'French'] },
    { name: 'Kenya', capital: 'Nairobi', population: 55100000, region: 'Africa', languages: ['Swahili', 'English'] },
    { name: 'Australia', capital: 'Canberra', population: 26600000, region: 'Oceania', languages: ['English'] },
    { name: 'Chile', capital: 'Santiago', population: 19700000, region: 'Americas', languages: ['Spanish'] }
  ] };
  SAMPLES.web.trivia = { desc: 'Five computing quiz questions.', json: { results: [
    { category: 'Computing', difficulty: 'easy', question: 'What does CPU stand for?', correct_answer: 'Central Processing Unit', incorrect_answers: ['Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'] },
    { category: 'Computing', difficulty: 'easy', question: 'How many bits are in a byte?', correct_answer: '8', incorrect_answers: ['4', '16', '10'] },
    { category: 'Computing', difficulty: 'medium', question: 'Which protocol turns names like school.example into IP addresses?', correct_answer: 'DNS', incorrect_answers: ['HTTP', 'FTP', 'SMTP'] },
    { category: 'Computing', difficulty: 'medium', question: 'What is 1010 in binary as a decimal number?', correct_answer: '10', incorrect_answers: ['12', '8', '5'] },
    { category: 'Computing', difficulty: 'hard', question: 'Which sorting algorithm repeatedly swaps neighbouring items?', correct_answer: 'Bubble sort', incorrect_answers: ['Merge sort', 'Quick sort', 'Binary sort'] }
  ] } };
  SAMPLES.web.echo = { desc: 'Returns what you send with post_json.', json: { status: 200, received: null } };

  SAMPLES.csv.students = [
    'name,class,grade,score,city,club',
    'Maria Lopez,7A,7,88,Madrid,Robotics', 'Nikos Pappas,7A,7,72, athens ,Chess', 'Aisha Khan,7B,7,95,Muscat,Robotics', 'Tom Evans,7B,7,,London,Drama',
    'Lucia Quispe,8A,8,64,Lima,Football', 'Yuki Sato,8A,8,91,Tokyo,Coding', 'Omar Said,8B,8,N/A,Muscat,Football', 'Eva Nagy,8B,8,79,Budapest,Chess',
    'Jean Uwase,8B,8,83,Kigali,Coding', 'Carlos Ruiz,9A,9,58,madrid,Football', 'Sofia Rossi,9A,9,97,Rome,Robotics', 'Daniel Kim,9A,9,45,Seoul,Drama',
    'Amara Obi,9B,9,77,Lagos,Coding', 'Lena Weber,9B,9,69,Berlin,Chess', 'Pedro Silva,9B,9,81,Lima ,Football', 'Hana Ali,10A,10,90,Muscat,Coding',
    'Marco Bianchi,10A,10,53,Rome,Drama', 'Ines Garcia,10A,10,74,Madrid,Robotics', 'Kofi Mensah,10B,10,66,Accra,Football', 'Zoe Brown,10B,10,99,London,Coding',
    'Nikos Pappas,7A,7,72, athens ,Chess', 'Ana Torres,7A,7,61,Lima,Drama', 'Leo Martin,8A,8,,Paris,Chess', 'Mia Novak,9A,9,86,Prague,Robotics',
    'Sami Haddad,10B,10,70,Beirut,Coding', 'Elena Ivanova,8B,8,93,Sofia,Robotics', 'Ravi Patel,9B,9,48,Mumbai,Football', 'Chloe Martin,7B,7,84,Paris,Coding',
    'Diego Flores,10A,10,-,Lima,Football', 'Ioanna Georgiou,9A,9,89,ATHENS,Chess'
  ].join('\n');
  SAMPLES.csv.weather_daily = ['date,city,max_temp,min_temp,rain_mm'].concat(Array.from({ length: 30 }, (_, i) => {
    const d = `2026-06-${String(i + 1).padStart(2, '0')}`;
    const mx = Math.round((27 + 5 * Math.sin(i / 5) + (i % 7) * 0.4) * 10) / 10, mn = Math.round((mx - 9 - (i % 3)) * 10) / 10;
    return `${d},Athens,${mx},${mn},${i % 9 === 4 ? 3.2 : i % 11 === 0 ? 0.8 : 0}`;
  })).join('\n');
  SAMPLES.csv.login_log = ['time,user,ip,result'].concat((() => {
    const rows = []; const users = ['maria', 'nikos', 'aisha', 'tom', 'admin'];
    for (let i = 0; i < 18; i++) rows.push(`08:${String(i * 3).padStart(2, '0')},${users[i % 4]},192.168.1.${10 + (i % 4)},${i % 6 === 5 ? 'fail' : 'success'}`);
    for (let i = 0; i < 12; i++) rows.push(`09:${String(10 + i).padStart(2, '0')},admin,203.0.113.66,fail`);
    rows.push('09:23,admin,203.0.113.66,success');
    rows.push('09:30,nikos,192.168.1.11,success');
    return rows;
  })()).join('\n');
  SAMPLES.csv.phishing_emails = [
    'subject,sender,body,is_phishing',
    'Your account will be closed,security@schoo1-mail.example,Click this link within 24 hours to keep your account: http://bit.example/verify,yes',
    'Robotics club meets Friday,teacher@school.example,Bring your robot kits to room 12 after lunch.,no',
    'You won a phone!,prizes@win-now.example,Congratulations! Send your password to claim your prize today.,yes',
    'Homework reminder,maths@school.example,Remember the fractions worksheet is due on Monday.,no',
    'Urgent: payment failed,billing@paypa1.example,Your payment failed. Enter your card number here immediately.,yes',
    'Library books due,library@school.example,Two of your books are due next week. You can renew them online.,no',
    'Password expires today,it-support@schoo1.example,Your password expires today. Log in at this link to keep it.,yes',
    'Football match moved,coach@school.example,The match is now on Thursday at 4 pm.,no'
  ].join('\n');

  SAMPLES.networks.home_network = {
    devices: [['device', 'laptop', '192.168.1.10'], ['device', 'phone', '192.168.1.11'], ['device', 'printer', '192.168.1.20'], ['router', 'home_router', '192.168.1.1'],
      ['router', 'isp_router', '100.64.0.1'], ['server', 'school_server', '203.0.113.5']],
    links: [['laptop', 'home_router', 2], ['phone', 'home_router', 5], ['printer', 'home_router', 2], ['home_router', 'isp_router', 8], ['isp_router', 'school_server', 12]],
    dns: [['school.example', '203.0.113.5']],
    sites: [['school_server', { '/': 'Welcome to the school website', '/timetable': 'Mon: Maths, Computing | Tue: Science, English', '/news': 'Robotics club won the regional final!' }]]
  };
  SAMPLES.networks.internet_small = {
    devices: [['device', 'home_pc', '192.168.0.2'], ['router', 'home_gw', '192.168.0.1'], ['router', 'r1', '10.0.1.1'], ['router', 'r2', '10.0.2.1'], ['router', 'r3', '10.0.3.1'],
      ['router', 'r4', '10.0.4.1'], ['server', 'news_server', '198.51.100.7'], ['server', 'video_server', '198.51.100.9']],
    links: [['home_pc', 'home_gw', 1], ['home_gw', 'r1', 6], ['r1', 'r2', 10], ['r1', 'r3', 4], ['r3', 'r2', 3], ['r2', 'r4', 8], ['r3', 'r4', 15], ['r4', 'news_server', 2], ['r2', 'video_server', 5]],
    dns: [['news.example', '198.51.100.7'], ['video.example', '198.51.100.9']],
    sites: [['news_server', { '/': 'Today: new school opens in the valley', '/sport': 'Local team wins 3-1' }], ['video_server', { '/': 'Video list: robots.mp4, volcano.mp4' }]]
  };

  const EX = (id, title, titleEs, code) => SAMPLES.examples.push({ id, title, titleEs, code: code.replace(/^\n/, '') });
  EX('hello', 'Hello and input', 'Hola y datos', `
# Ask for a name and an age, then answer
name = ASK("What is your name?")
PRINT "Hello, " + name + "!"

age = whole(ASK("How old are you?"))
IF age >= 13 THEN
    PRINT "You are a teenager."
ELSE IF age >= 10 THEN
    PRINT "Almost a teenager!"
ELSE
    PRINT "You are young and curious."
END IF

PRINT "In 5 years you will be", age + 5
`);
  EX('turtle', 'Turtle star pattern', 'Estrellas con la tortuga', `
# Draw a ring of coloured stars with the turtle
FUNCTION star(size)
    REPEAT 5 TIMES
        forward(size)
        turn(144)
    END REPEAT
END FUNCTION

colors = ["#2750D8", "#1F8A4C", "#C8372D", "#B7791F", "#6B46C1"]
pen_size(2)
FOR i FROM 0 TO 9
    pen_color(colors[i MOD 5])
    star(80)
    turn(36)
END FOR
hide_turtle()
write(-60, -170, "Ten stars, one loop")
`);
  EX('grades', 'Grades with tests and docs', 'Notas con pruebas y documentación', `
DOC
  PURPOSE: Turns a test score into a result.
  INPUTS: score (whole number from 0 to 100)
  RETURNS: "pass" or "fail"
  ERRORS: fails if the score is outside 0 to 100
  EXAMPLE: grade(72) -> "pass"
  EXAMPLE: grade(10) -> "fail"
END DOC
FUNCTION grade(score)
    IF score < 0 OR score > 100 THEN
        FAIL "score must be 0 to 100"
    END IF
    IF score >= 50 THEN
        RETURN "pass"
    END IF
    RETURN "fail"
END FUNCTION

DOC
  PURPOSE: Asks for a score until the user types a valid number.
  RETURNS: the score as a whole number
END DOC
FUNCTION ask_score()
    answer = ASK("Score (0-100)?")
    WHILE NOT answer.is_digits() OR whole(answer) > 100
        PRINT "Please type a whole number from 0 to 100."
        answer = ASK("Score (0-100)?")
    END WHILE
    RETURN whole(answer)
END FUNCTION

s = ask_score()
PRINT "Result:", grade(s)

TEST "normal scores"
    EXPECT grade(72) == "pass"
    EXPECT grade(10) == "fail"
END TEST

TEST "boundary at 50"
    EXPECT grade(49) == "fail"
    EXPECT grade(50) == "pass"
    EXPECT grade(100) == "pass"
END TEST

TEST "impossible scores"
    EXPECT ERROR grade(101) CONTAINS "0 to 100"
    EXPECT ERROR grade(-1)
END TEST

TEST "invalid input is asked again" WITH INPUTS ["abc", "150", "64"]
    EXPECT ask_score() == 64
    EXPECT length(printed()) == 2
END TEST
`);
  EX('pets', 'Pets: classes and objects', 'Mascotas: clases y objetos', `
DOC
  PURPOSE: A pet with a name and an energy level.
  ATTRIBUTES: name (text), energy (whole number)
END DOC
CLASS Pet
    INIT(name)
        SELF.name = name
        SELF.energy = 5
    END INIT

    FUNCTION play()
        SELF.energy = SELF.energy - 2
    END FUNCTION

    FUNCTION describe()
        RETURN SELF.name + " (energy " + text(SELF.energy) + ")"
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

pets = [NEW Pet("Milo"), NEW Dog("Rex", "collie")]
PRINT pets[1].fetch()
FOR EACH p IN pets
    p.play()
    PRINT p
END FOR
PRINT is_a(pets[1], Pet), is_a(pets[0], Dog)
`);
  EX('data', 'Data: clean and chart student scores', 'Datos: limpiar y graficar notas', `
# Load a messy sample dataset, clean it and chart it
rows = load_csv("sample:students")
PRINT length(rows), "rows loaded"
describe(rows)

rows = dedupe(rows)
rows = drop_missing(rows, "score")
FOR EACH r IN rows
    r["city"] = clean_text(r["city"]).title()
END FOR
PRINT length(rows), "rows after cleaning"

stats = summarize(rows, "score")
PRINT "Mean score:", round(stats["mean"], 1), "Median:", stats["median"]

groups = group_by(rows, "grade")
labels = []
means = []
FOR EACH g IN groups.keys()
    labels.add("Grade " + text(g))
    means.add(round(mean(column(groups[g], "score")), 1))
END FOR
bar_chart(labels, means, "Mean score by grade")

top = sort_by(where(rows, "score", ">=", 90), "score", "desc")
show_table(select(top, ["name", "grade", "score"]))
`);
  EX('network', 'Network: routing and a firewall', 'Red: rutas y cortafuegos', `
# A home network sending messages to the school server
net = load_network("sample:home_network")
PRINT "Route:", net.route("laptop", "school.example")
PRINT "Ping:", net.ping("laptop", "school_server"), "ms"

CLASS Firewall EXTENDS Device
    INIT(name, ip)
        PARENT.INIT(name, ip)
        SELF.blocked = ["secret"]
    END INIT

    FUNCTION on_packet(packet)
        FOR EACH word IN SELF.blocked
            IF packet["data"].contains(word) THEN
                RETURN FALSE
            END IF
        END FOR
        RETURN TRUE
    END FUNCTION
END CLASS

fw = NEW Firewall("firewall", "192.168.1.2")
net.add(fw)
net.disconnect("home_router", "isp_router")
net.connect("home_router", "firewall", 1)
net.connect("firewall", "isp_router", 8)

net.set_loss(0.2)
report = net.send("laptop", "school.example", "Hello from the laptop!", 6, "reliable")
PRINT report["message"], "| lost:", report["lost"], "resent:", report["resent"]

net.set_loss(0)
report = net.send("laptop", "school_server", "my secret password", 20, "fast")
PRINT "Delivered:", report["delivered"], "blocked:", report["blocked"]

page = net.request("phone", "http://school.example/timetable")
PRINT page["status"], page["body"]
show_table(net.logs())
net.draw()
`);
  EX('security', 'Security: ciphers, hashes, passwords', 'Seguridad: cifrados, hash y contraseñas', `
secret = caesar("Meet at the library", 3)
PRINT secret
PRINT caesar(secret, -3)

counts = letter_frequencies(caesar("the quick brown fox jumps over the lazy dog again and again", 7))
PRINT "Most common letters:", counts.keys()[0:3]

PRINT hash_text("hello")
PRINT hash_text("hellO")

FOR EACH pw IN ["qwerty", "Tr1cky!", "correct horse battery staple"]
    check = password_strength(pw)
    PRINT pw, "->", check["crack_time"], "score", check["score"]
END FOR

result = brute_force_demo(hash_text("dog"), "abcdefghijklmnopqrstuvwxyz", 3)
PRINT "Found:", result["found"]

keys = make_toy_keys()
code = toy_encrypt("Hi!", keys["public"])
PRINT code, "->", toy_decrypt(code, keys["private"])

policy = NEW AccessPolicy()
policy.allow("teacher", "edit", "grades")
policy.allow("student", "read", "*")
PRINT policy.can("student", "edit", "grades"), policy.can("student", "read", "timetable")
`);
  EX('ui', 'Screen controls: a greeter app', 'Controles: una aplicación de saludo', `
# Build a small app with controls
title = label("Type your name and choose a language")
name_box = input_box("Your name")
lang = dropdown(["English", "Español", "Ελληνικά"])
go = button("Greet me")
answer = label("")

FUNCTION greet()
    n = name_box.value.trim()
    IF n == "" THEN
        answer.text = "Please type a name first."
        RETURN
    END IF
    IF lang.value == "Español" THEN
        answer.text = "¡Hola, " + n + "!"
    ELSE IF lang.value == "Ελληνικά" THEN
        answer.text = "Γεια σου, " + n + "!"
    ELSE
        answer.text = "Hello, " + n + "!"
    END IF
END FUNCTION

on_click(go, greet)
`);
  EX('sorting', 'Sorting: bubble sort step by step', 'Ordenar: burbuja paso a paso', `
# Watch the list in the Debug panel (switch it to bars)
FUNCTION bubble_sort(items)
    n = length(items)
    FOR i FROM 0 TO n - 2
        FOR j FROM 0 TO n - 2 - i
            IF items[j] > items[j + 1] THEN
                temp = items[j]
                items[j] = items[j + 1]
                items[j + 1] = temp
            END IF
        END FOR
    END FOR
    RETURN items
END FUNCTION

random_seed(7)
numbers = []
REPEAT 8 TIMES
    numbers.add(random(1, 50))
END REPEAT
PRINT "Before:", numbers
start = steps()
bubble_sort(numbers)
PRINT "After: ", numbers
PRINT "Steps used:", steps() - start

FOR i FROM 0 TO length(numbers) - 1
    fill_color("#2750D8")
    rect(-260 + i * 65, -150 + numbers[i] * 5, 50, numbers[i] * 5)
END FOR

TEST "sorts numbers"
    EXPECT bubble_sort([3, 1, 2]) == [1, 2, 3]
    EXPECT bubble_sort([]) == []
    EXPECT bubble_sort([5]) == [5]
END TEST
`);
  EX('weather', 'Web data: weather forecast', 'Datos web: previsión del tiempo', `
# get_json works offline here with sample: addresses
data = get_json("sample:weather/madrid")
now_temp = data["current"]["temperature_2m"]
PRINT "Now in Madrid:", now_temp, "°C"

temps = data["hourly"]["temperature_2m"]
hours = []
FOR h FROM 0 TO 23
    hours.add(h)
END FOR
PRINT "Warmest hour:", hours[temps.find(max(temps))], "at", max(temps), "°C"
line_chart(hours, temps, "Temperature in Madrid today")
`);
})();
