# BASIC62 language reference

This reference is generated from the BASIC62 CodeLab engine source (`node tools/gen_reference.js`), so it lists exactly what the current build implements. Names are given for both editions: English and Spanish.

## Keywords

Keywords are not case-sensitive (`print`, `Print` and `PRINT` all work); the Spanish single-letter operators `Y` and `O` must be written in capitals. Variable and function names are case-sensitive.

| English | Spanish |
| --- | --- |
| `IF` | `SI` |
| `THEN` | `ENTONCES` |
| `ELSE` | `SINO` |
| `END` | `FIN` |
| `WHILE` | `MIENTRAS` |
| `REPEAT` | `REPETIR` |
| `TIMES` | `VECES` |
| `FOR` | `PARA` |
| `FROM` | `DESDE` |
| `TO` | `HASTA` |
| `STEP` | `CON PASO` |
| `IN` | `EN` |
| `BREAK` | `SALIR` |
| `CONTINUE` | `CONTINUAR` |
| `FUNCTION` | `FUNCIÓN` |
| `RETURN` | `DEVOLVER` |
| `CLASS` | `CLASE` |
| `EXTENDS` | `EXTIENDE` |
| `INIT` | `INICIAR` |
| `NEW` | `NUEVO` |
| `SELF` | `ESTE` |
| `PARENT` | `PADRE` |
| `TRY` | `INTENTAR` |
| `ON ERROR` | `SI FALLA` |
| `FAIL` | `FALLAR` |
| `TEST` | `PRUEBA` |
| `EXPECT` | `COMPROBAR` |
| `EXPECT ERROR` | `COMPROBAR ERROR` |
| `WITH INPUTS` | `CON ENTRADAS` |
| `CONTAINS` | `CONTIENE` |
| `DOC` | `DOC` |
| `DIV` | `DIV` |
| `MOD` | `MOD` |
| `AND` | `Y` |
| `OR` | `O` |
| `NOT` | `NO` |
| `TRUE` | `VERDADERO` |
| `FALSE` | `FALSO` |
| `NOTHING` | `NADA` |
| `PRINT` | `MOSTRAR` |
| `ELSE IF` | `SINO SI` |
| `FOR EACH` | `PARA CADA` |

## Block structure

```
IF condition THEN ... ELSE IF condition THEN ... ELSE ... END IF
REPEAT n TIMES ... END REPEAT
FOR i FROM a TO b [STEP s] ... END FOR        # both ends included
FOR EACH x IN list_text_or_dictionary ... END FOR
WHILE condition ... END WHILE
FUNCTION name(a, b = default) ... RETURN value ... END FUNCTION
CLASS Name [EXTENDS Parent] INIT(...) ... END INIT  FUNCTION method() ... END FUNCTION END CLASS
TRY ... ON ERROR [message] ... END TRY
TEST "name" [WITH INPUTS [...]] EXPECT condition  EXPECT ERROR call CONTAINS "text" END TEST
DOC  PURPOSE: ...  INPUTS: ...  RETURNS: ...  EXAMPLE: call -> result  END DOC
```

DOC block fields: `PURPOSE` / `PROPÓSITO`, `INPUTS` / `ENTRADAS`, `RETURNS` / `DEVUELVE`, `ATTRIBUTES` / `ATRIBUTOS`, `ERRORS` / `ERRORES`, `EXAMPLE` / `EJEMPLO`.

## Built-in functions (111)

### Core

| Function | Spanish | Description |
| --- | --- | --- |
| `ASK(question)` | `PREGUNTAR` | Shows a question and waits for the user to type an answer. Always returns text. |
| `type(value)` | `tipo` | The type of a value as text, such as "whole number" or "list". For an object, its class name. |
| `whole(value)` | `entero` | Converts text or a decimal to a whole number (decimals are cut, not rounded). |
| `decimal(value)` | `decimal` | Converts text or a whole number to a decimal number. |
| `text(value)` | `texto` | Converts any value to text. |
| `round(number, places = 0)` | `redondear` | Rounds a number. With no places it gives a whole number (halves round to the even neighbour, as in Python). |
| `length(value)` | `longitud` | How many items a list or dictionary has, or how many characters a text has. |
| `copy(list_or_dict)` | `copiar` | Makes an independent copy of a list or dictionary. |
| `is_a(object, Class)` | `es_un` | TRUE if the object was made from the class or from a class that extends it. |
| `random(low, high)` | `aleatorio` | A random whole number from low to high, including both. |
| `random_seed(seed)` | `semilla_aleatoria` | Makes random numbers repeat the same sequence every run, for testing and comparing algorithms. |
| `sqrt(number)` | `raiz` | Square root, as a decimal number. |
| `abs(number)` | `abs` | The number without its minus sign. |
| `min(list)` | `min` | The smallest value in a list (or of several values). |
| `max(list)` | `max` | The largest value in a list (or of several values). |
| `sum(list)` | `suma` | Adds up all the numbers in a list. |
| `now()` | `ahora` | The current date and time as text, such as "2026-09-24 14:05:09". |
| `timer()` | `cronometro` | Seconds since the program started, as a decimal. Use it to time parts of a program. |
| `steps()` | `pasos` | How many statements the program has run so far. Compare algorithms without depending on computer speed. |

### Text

| Function | Spanish | Description |
| --- | --- | --- |
| `join(list, separator = "")` | `unir` | Joins the items of a list into one text, with the separator between them. |
| `code_of(character)` | `codigo_de` | The number code of a single character (for example 65 for "A"). |
| `char_of(code)` | `caracter_de` | The character for a number code (for example "A" for 65). |
| `format(number, places)` | `formato` | The number as text with exactly this many decimal places. |

### Turtle and drawing

| Function | Spanish | Description |
| --- | --- | --- |
| `wait(seconds)` | `esperar` | Pauses the program for this many seconds. |
| `every(seconds, function)` | `repetir_cada` | Runs a function again and again, every this many seconds, until the program is stopped. |
| `on_key(key, function)` | `al_pulsar_tecla` | Runs the function when a key is pressed: "left", "right", "up", "down", "space" or a letter. |
| `mouse_x()` | `raton_x` | The mouse x position over the canvas. |
| `mouse_y()` | `raton_y` | The mouse y position over the canvas. |
| `forward(distance)` | `avanzar` | Moves the turtle forward, drawing a line if the pen is down. |
| `back(distance)` | `retroceder` | Moves the turtle backwards. |
| `turn(degrees)` | `girar` | Turns the turtle clockwise. Use a negative number to turn anticlockwise. |
| `go_to(x, y)` | `ir_a` | Moves the turtle to a point. (0, 0) is the centre; y goes up. |
| `pen_up()` | `subir_lapiz` | Stops the turtle drawing when it moves. |
| `pen_down()` | `bajar_lapiz` | Makes the turtle draw when it moves. |
| `hide_turtle()` | `ocultar_tortuga` | Hides the turtle arrow. |
| `show_turtle()` | `mostrar_tortuga` | Shows the turtle arrow again. |
| `pen_color(color)` | `color_lapiz` | Sets the line color: a name such as "teal" or a code such as "#1a9e8f". |
| `pen_size(width)` | `grosor_lapiz` | Sets the line width. |
| `fill_color(color)` | `color_relleno` | Sets the fill color for circles and rectangles. Use "none" for no fill. |
| `circle(x, y, radius)` | `circulo` | Draws a circle centred on (x, y). |
| `rect(x, y, width, height)` | `rectangulo` | Draws a rectangle whose top-left corner is at (x, y). |
| `line(x1, y1, x2, y2)` | `linea` | Draws a straight line between two points. |
| `write(x, y, text)` | `escribir` | Writes text on the canvas at (x, y). |
| `clear()` | `borrar` | Clears the canvas. |

### Screen controls

| Function | Spanish | Description |
| --- | --- | --- |
| `button(caption)` | `boton` | Adds a button. Use on_click to choose what it does. |
| `label(text)` | `etiqueta` | Adds a line of text that the program can change with .text. |
| `input_box(placeholder)` | `caja_texto` | Adds a text box. Read what was typed with .value. |
| `number_box(placeholder)` | `caja_numero` | Adds a box for numbers. .value is a number, or NOTHING when empty. |
| `slider(min, max)` | `deslizador` | Adds a slider between two whole numbers. |
| `dropdown(options)` | `desplegable` | Adds a drop-down list of options. .value is the chosen option. |
| `checkbox(caption)` | `casilla` | Adds a checkbox. .value is TRUE when ticked. |
| `on_click(control, function)` | `al_hacer_clic` | Runs the function whenever the control is clicked. |
| `on_change(control, function)` | `al_cambiar` | Runs the function whenever the control's value changes. |

### Web data (offline samples)

| Function | Spanish | Description |
| --- | --- | --- |
| `from_json(text)` | `desde_json` | Turns JSON text into dictionaries and lists. |
| `to_json(value)` | `a_json` | Turns dictionaries and lists into JSON text. |
| `get_json(address)` | `obtener_json` | Gets data from a web API as dictionaries and lists. This offline app answers sample: addresses. |
| `get_text(address)` | `obtener_texto` | Gets a web page or file as text. |
| `post_json(address, data)` | `enviar_json` | Sends data to a web API. Only sample:echo works offline; it returns what you sent. |

### Data tools and charts

| Function | Spanish | Description |
| --- | --- | --- |
| `load_csv(file)` | `cargar_csv` | Loads a CSV file (or a sample: dataset) as a list of dictionaries, one per row. Numbers are detected automatically. |
| `save_csv(file, rows)` | `guardar_csv` | Saves a list of dictionaries as a CSV file in the project. |
| `save_text(file, text)` | `guardar_texto` | Saves text as a file in the project. |
| `load_text(file)` | `cargar_texto` | Loads a project file as text. |
| `list_files()` | `listar_archivos` | The names of the files in this project. |
| `show_table(rows)` | `mostrar_tabla` | Shows a list of dictionaries (or a list of lists) as a table in the output. |
| `describe(rows)` | `describir` | Shows each column with its detected type, how many values are missing, and its range. A start for a data dictionary. |
| `column(rows, column)` | `columna` | All the values of one column, as a list. |
| `select(rows, columns)` | `seleccionar` | New rows with only the listed columns. |
| `unique(list)` | `unicos` | The list without repeated values, in first-seen order. |
| `sort_by(rows, column, order = "asc")` | `ordenar_por` | New rows sorted by a column. Use "desc" for largest first. Missing values go last. |
| `where(rows, column, operator, value)` | `donde` | Rows where the column matches, for example where(rows, "score", ">=", 50). Operators: == != < > <= >= contains. |
| `filter_rows(rows, test_function)` | `filtrar_filas` | Rows for which your function returns TRUE. The function receives one row. |
| `group_by(rows, column)` | `agrupar_por` | A dictionary from each value of the column to the list of rows that have it. |
| `count_by(rows, column)` | `contar_por` | A dictionary from each value of the column to how many rows have it. |
| `summarize(rows, column)` | `resumir` | Count, sum, mean, median, mode, min and max of a number column, as a dictionary. |
| `mean(list)` | `media` | The average of a list of numbers (missing values skipped). |
| `median(list)` | `mediana` | The middle value of a list of numbers. |
| `mode(list)` | `moda` | The most common value in a list. |
| `stdev(list)` | `desviacion` | The sample standard deviation: how spread out the numbers are. |
| `is_missing(value)` | `es_vacio` | TRUE for NOTHING, empty text and markers such as "N/A". |
| `drop_missing(rows, column)` | `quitar_vacios` | New rows without the ones where the column is missing. |
| `fill_missing(rows, column, value)` | `rellenar_vacios` | New rows where missing values in the column are replaced. |
| `dedupe(rows)` | `quitar_duplicados` | New rows with exact duplicate rows removed. |
| `rename_column(rows, old, new)` | `renombrar_columna` | New rows with a column renamed. |
| `convert_column(rows, column, "number" or "text")` | `convertir_columna` | New rows with a column converted. Values that cannot be converted become NOTHING. |
| `clean_text(text)` | `limpiar_texto` | Trims the text and turns runs of spaces, tabs and new lines into single spaces. |
| `remove_punctuation(text)` | `quitar_puntuacion` | The text without punctuation marks. |
| `words(text)` | `palabras` | The words of a text in lower case, without punctuation. |
| `word_counts(text)` | `contar_palabras` | A dictionary from each word to how many times it appears, most common first. |
| `to_number(text, default)` | `a_numero` | Converts text to a number, or gives the default when it cannot. |
| `bar_chart(labels, values, title = "")` | `grafico_barras` | Draws a bar chart on the canvas. |
| `line_chart(xs, ys, title = "")` | `grafico_lineas` | Draws a line chart on the canvas. |
| `scatter_chart(xs, ys, title = "")` | `grafico_dispersion` | Draws a scatter chart on the canvas. |
| `histogram(values, bins, title = "")` | `histograma` | Draws a histogram: how many values fall in each range. |

### Simulated network

| Function | Spanish | Description |
| --- | --- | --- |
| `split_into_packets(message, size)` | `dividir_en_paquetes` | Splits a message into packets: dictionaries with seq, total, src, dst, data and checksum. |
| `reassemble(packets)` | `reensamblar` | Puts packets back in order and joins their data. Missing packets show as "?". |
| `is_valid_ip(text)` | `es_ip_valida` | TRUE for addresses like 192.168.1.10 (four numbers from 0 to 255). |
| `same_subnet(ip1, ip2)` | `misma_subred` | TRUE if the first three numbers match, so the devices share a local network (/24). |
| `load_network(sample)` | `cargar_red` | A ready-made network: "sample:home_network" or "sample:internet_small". |

### Security

| Function | Spanish | Description |
| --- | --- | --- |
| `caesar(text, shift)` | `cesar` | Shifts each letter A to Z along the alphabet. Use a negative shift to decode. Not safe for real secrets. |
| `vigenere(text, key)` | `vigenere` | Encrypts letters with a keyword: each letter of the key gives a different shift. |
| `vigenere_decrypt(text, key)` | `vigenere_descifrar` | Decrypts text made with vigenere and the same key. |
| `letter_frequencies(text)` | `frecuencia_letras` | A dictionary from each letter to how many times it appears, most common first. The basis of frequency analysis. |
| `hash_text(text)` | `hash_texto` | The SHA-256 hash of the text as 64 hexadecimal characters. Any change to the text changes the hash completely. |
| `random_salt()` | `sal_aleatoria` | Eight random hexadecimal characters to add to a password before hashing. |
| `checksum(text)` | `suma_verificacion` | A simple checksum: the sum of the character codes, from 0 to 255. Easy to fool, unlike a hash. |
| `password_strength(password)` | `fuerza_contrasena` | Checks a password: length, character sets, estimated guesses, crack time at 10 billion guesses per second, and a score from 0 to 4. |
| `brute_force_demo(target_hash, charset, max_length)` | `demo_fuerza_bruta` | Tries every password up to max_length (at most 4) from the charset and reports how many attempts it took. Shows why long passwords matter. |
| `make_toy_keys()` | `crear_claves_juguete` | A tiny RSA key pair from two small primes: public [e, n] and private [d, n]. Far too small to protect anything. |
| `toy_encrypt(message, public_key)` | `cifrar_juguete` | Encrypts each character with the public key. Gives a list of numbers. |
| `toy_decrypt(numbers, private_key)` | `descifrar_juguete` | Decrypts a list of numbers made by toy_encrypt, using the private key. |

### Testing

| Function | Spanish | Description |
| --- | --- | --- |
| `printed()` | `mostrado` | In a TEST: the list of lines the code has printed so far. |

## Text methods (21)

| Method | Spanish | Description |
| --- | --- | --- |
| `.upper()` | `.mayusculas` | The text in capital letters. |
| `.lower()` | `.minusculas` | The text in small letters. |
| `.title()` | `.titulo` | The text with each word starting with a capital. |
| `.trim()` | `.recortar` | The text without spaces at the start and end. |
| `.trim_start()` | `.recortar_inicio` | The text without spaces at the start. |
| `.trim_end()` | `.recortar_final` | The text without spaces at the end. |
| `.split(separator)` | `.dividir` | A list of the parts between separators. With no separator, splits at spaces. |
| `.split_lines()` | `.dividir_lineas` | A list of the lines of the text. |
| `.contains(part)` | `.contiene` | TRUE if the part appears in the text. |
| `.starts_with(part)` | `.empieza_con` | TRUE if the text starts with the part. |
| `.ends_with(part)` | `.termina_con` | TRUE if the text ends with the part. |
| `.find(part)` | `.buscar` | The position of the part in the text, or -1 if it is not there. |
| `.count(part)` | `.contar` | How many times the part appears. |
| `.replace(old, new)` | `.reemplazar` | The text with every old part replaced by the new one. |
| `.repeat(times)` | `.repetir` | The text repeated this many times. |
| `.is_number()` | `.es_numero` | TRUE if the text is a number such as "12", "-3.5" or " 7 ". |
| `.is_letters()` | `.es_letras` | TRUE if the text has only letters. |
| `.is_digits()` | `.es_digitos` | TRUE if the text has only digits 0 to 9. |
| `.is_blank()` | `.esta_vacio` | TRUE if the text is empty or only spaces. |
| `.pad_left(width, fill = " ")` | `.rellenar_izquierda` | The text made at least this wide by adding characters on the left. |
| `.pad_right(width, fill = " ")` | `.rellenar_derecha` | The text made at least this wide by adding characters on the right. |

## List methods (7)

| Method | Spanish | Description |
| --- | --- | --- |
| `.add(value)` | `.agregar` | Adds a value to the end of the list. |
| `.insert(position, value)` | `.insertar` | Inserts a value at a position, moving the rest along. |
| `.remove(value)` | `.quitar` | Removes the first item equal to the value. |
| `.remove_at(position)` | `.quitar_en` | Removes the item at a position and gives it back. |
| `.find(value)` | `.buscar` | The position of the first item equal to the value, or -1. |
| `.sort()` | `.ordenar` | Sorts the list from smallest to largest (numbers or text, not mixed). |
| `.reverse()` | `.invertir` | Reverses the order of the list. |

## Dictionary methods (4)

| Method | Spanish | Description |
| --- | --- | --- |
| `.get(key, default = NOTHING)` | `.obtener` | The value for the key, or the default if the key is missing. |
| `.keys()` | `.claves` | A list of the keys. |
| `.values()` | `.valores` | A list of the values. |
| `.remove(key)` | `.quitar` | Removes a key and its value. |

## Built-in classes

### Network (`Red`)

Create with `NEW Network()`.

| Method | Spanish | Description |
| --- | --- | --- |
| `.add_device(name, ip)` | `.agregar_dispositivo` | Adds a computer, phone or other device and gives it back. |
| `.add_router(name, ip)` | `.agregar_router` | Adds a router that passes packets between links. |
| `.add_server(name, ip)` | `.agregar_servidor` | Adds a server that can answer requests (see on_request). |
| `.add(device)` | `.agregar` | Adds a device object you made yourself, for example NEW Firewall(...). |
| `.connect(a, b, latency = 1)` | `.conectar` | Connects two devices. The latency is the time in milliseconds for a packet to cross the link. |
| `.disconnect(a, b)` | `.desconectar` | Removes the link between two devices. |
| `.add_dns(name, ip)` | `.agregar_dns` | Adds a name such as "school.example" to the network's phone book (DNS). |
| `.lookup(name)` | `.buscar_nombre` | The IP address for a name, or NOTHING. |
| `.devices()` | `.dispositivos` | A list of all devices. |
| `.route(from, to)` | `.ruta` | The names of the devices a packet passes through (fastest path). Empty if there is no path. |
| `.ping(from, to)` | `.ping` | Round-trip time in milliseconds, or -1 if the destination can't be reached. |
| `.trace(from, to)` | `.trazar` | Each hop on the way, with its time so far (like traceroute). |
| `.set_loss(fraction)` | `.fijar_perdida` | Makes links drop this fraction of packets, for example 0.1 for 10%. |
| `.send(from, to, message, size = 8, mode = "reliable")` | `.enviar` | Sends a message split into packets. "reliable" resends lost packets (like TCP); "fast" does not (like UDP). Gives back a report. |
| `.request(from, address)` | `.solicitar` | Sends a web-style request such as "http://school.example/timetable" and gives back a response with status and body. |
| `.logs()` | `.registros` | Every network event so far, as rows (time, event, from, to, detail). |
| `.draw()` | `.dibujar` | Draws the network on the canvas and animates the last message sent. |

### Device (`Dispositivo`)

Create with `NEW Device(name, ip)`. Attributes: `name`, `ip`, `kind`.

| Method | Spanish | Description |
| --- | --- | --- |
| `.on_packet(packet)` | `.al_recibir_paquete` | Called for every packet that reaches this device. RETURN TRUE to accept or pass it on, FALSE to block it. Override it in your own class. |
| `.on_request(function)` | `.al_recibir_solicitud` | Sets the function that answers requests to this device. It receives a request dictionary (method, path, from) and returns the body text or a dictionary with status and body. |

### AccessPolicy (`PoliticaAcceso`)

Create with `NEW AccessPolicy()`.

| Method | Spanish | Description |
| --- | --- | --- |
| `.allow(role, action, resource)` | `.permitir` | Adds a rule: this role may do this action on this resource. Use "*" for any resource. |
| `.can(role, action, resource)` | `.puede` | TRUE if a rule allows it. Everything else is denied (deny by default). |
| `.rules()` | `.reglas` | All rules as rows (role, action, resource). |

## Error messages (54)

Placeholders in braces are filled in with names and values from the student's own program.

| Code | English message | Spanish message |
| --- | --- | --- |
| E101 | The `{kw}` on line {open} is never closed. Add `{end}` where the block should finish. | El `{kw}` de la línea {open} nunca se cierra. Añade `{end}` donde deba terminar el bloque. |
| E102 | Line {line} says `{said}`, but the block open here is the `{kw}` from line {open}. Did you mean `{end}`? | La línea {line} dice `{said}`, pero el bloque abierto aquí es el `{kw}` de la línea {open}. ¿Querías decir `{end}`? |
| E103 | This text is missing its closing quote. Add `{q}` at the end of the text. | A este texto le falta la comilla de cierre. Añade `{q}` al final del texto. |
| E104 | I don't understand the character `{ch}` here. | No entiendo el carácter `{ch}` aquí. |
| E105 | I didn't expect `{tok}` here.{hint} | No esperaba `{tok}` aquí.{hint} |
| E106 | An `{if}` line needs `{then}` at the end. | Una línea `{if}` necesita `{then}` al final. |
| E107 | To compare, use `==`. A single `=` stores a value. | Para comparar usa `==`. Un solo `=` guarda un valor. |
| E108 | `{end}` needs the name of the block it closes, such as `{example}`. | `{end}` necesita el nombre del bloque que cierra, por ejemplo `{example}`. |
| E109 | `{said}` on line {line} has no matching `{kw}` to close. | `{said}` en la línea {line} no tiene un `{kw}` que cerrar. |
| E110 | I expected a value or an expression here. | Esperaba un valor o una expresión aquí. |
| E111 | I expected a name here. | Esperaba un nombre aquí. |
| E112 | Functions and classes can only be created at the top level, not inside another block. | Las funciones y clases solo se pueden crear en el nivel principal, no dentro de otro bloque. |
| E113 | A `{open}` is missing its closing `{close}`. | A un `{open}` le falta su `{close}` de cierre. |
| E114 | You can only store a value in a variable, a list position, a dictionary key or an attribute. | Solo puedes guardar un valor en una variable, una posición de lista, una clave de diccionario o un atributo. |
| E115 | `{word}` is a keyword, so it can't be used as a name. | `{word}` es una palabra clave y no se puede usar como nombre. |
| E116 | `{kw}` can only be used inside a `{test}` block. | `{kw}` solo se puede usar dentro de un bloque `{test}`. |
| E117 | `{ret}` can only be used inside a function. | `{ret}` solo se puede usar dentro de una función. |
| E118 | `{kw}` can only be used inside a loop. | `{kw}` solo se puede usar dentro de un bucle. |
| E119 | Inside a `{class}` you can only write `{init}`, `{function}` and `{doc}` blocks. | Dentro de una `{class}` solo puedes escribir bloques `{init}`, `{function}` y `{doc}`. |
| E120 | I expected `{want}` here. | Esperaba `{want}` aquí. |
| E121 | `{self}` can only be used inside a method of a class. | `{self}` solo se puede usar dentro de un método de una clase. |
| E122 | A `{doc}` block must come right before a `{function}` or `{class}`. | Un bloque `{doc}` debe ir justo antes de una `{function}` o una `{class}`. |
| E201 | I don't know `{name}` yet.{hint} | Todavía no conozco `{name}`.{hint} |
| E202 | You can't add text and a number. Try `{fix}`. | No puedes sumar texto y un número. Prueba `{fix}`. |
| E203 | `{op}` doesn't work with {a} and {b}. | `{op}` no funciona con {a} y {b}. |
| E204 | `{name}` has {n} items, positions 0 to {last}. You asked for {i}. | `{name}` tiene {n} elementos, posiciones 0 a {last}. Pediste la {i}. |
| E205 | `{name}` has no key {key}. Its keys are: {keys}. | `{name}` no tiene la clave {key}. Sus claves son: {keys}. |
| E206 | `{cls}` objects have no attribute `{attr}`.{hint} New attributes belong in `{init}`. | Los objetos `{cls}` no tienen el atributo `{attr}`.{hint} Los atributos nuevos van en `{init}`. |
| E207 | {what} has no attribute or method `{attr}`.{hint} | {what} no tiene el atributo o método `{attr}`.{hint} |
| E208 | `{name}` expects {want}, but received {got}. | `{name}` espera {want}, pero recibió {got}. |
| E209 | {what} can't be called like a function. | {what} no se puede llamar como una función. |
| E210 | You can't divide by zero. | No se puede dividir entre cero. |
| E211 | Inside a function you can read `{name}` but not change it. `{ret}` the new value instead. | Dentro de una función puedes leer `{name}` pero no cambiarlo. Usa `{ret}` para devolver el nuevo valor. |
| E212 | `{src}` gave `{nothing}`, which can't be used in a calculation. Does the function use `{ret}`? | `{src}` dio `{nothing}`, que no se puede usar en un cálculo. ¿La función usa `{ret}`? |
| E213 | Too many calls inside calls (more than 500). A recursive function probably has no stopping case, or it goes too deep. | Demasiadas llamadas anidadas (más de 500). Seguramente a una función recursiva le falta el caso de parada o llega demasiado hondo. |
| E214 | {msg} | {msg} |
| E215 | `{fn}` can't turn {val} into {kind}. | `{fn}` no puede convertir {val} en {kind}. |
| E216 | You can only loop through a list, text or dictionary, not {what}. | Solo puedes recorrer una lista, un texto o un diccionario, no {what}. |
| E217 | Positions must be whole numbers, not {what}. | Las posiciones deben ser números enteros, no {what}. |
| E218 | Dictionary keys must be text or whole numbers. | Las claves de un diccionario deben ser texto o números enteros. |
| E219 | `{fn}`: {msg} | `{fn}`: {msg} |
| E220 | This app runs offline, so it can't reach `{url}`. Use a sample address such as `sample:weather`. | Esta aplicación funciona sin conexión y no puede acceder a `{url}`. Usa una dirección de ejemplo como `sample:weather`. |
| E221 | There is no file called `{name}`.{hint} | No hay ningún archivo llamado `{name}`.{hint} |
| E222 | I can't sort a list that mixes {a} and {b}. | No puedo ordenar una lista que mezcla {a} y {b}. |
| E223 | `{name}` is not a class, so `{new}` can't create it. | `{name}` no es una clase, así que `{new}` no puede crearla. |
| E224 | Text can't be changed in place. Build new text instead, for example with `replace`. | El texto no se puede cambiar directamente. Crea un texto nuevo, por ejemplo con `replace`. |
| E225 | I can't compare {a} and {b} with `{op}`. | No puedo comparar {a} y {b} con `{op}`. |
| E226 | `{name}` is a class. To create an object write `{new} {name}(...)`. | `{name}` es una clase. Para crear un objeto escribe `{new} {name}(...)`. |
| E227 | {msg} | {msg} |
| E228 | This text is not valid JSON: {msg} | Este texto no es JSON válido: {msg} |
| E229 | The test ran out of scripted inputs. Add more values to `{with}`. | La prueba se quedó sin entradas preparadas. Añade más valores a `{with}`. |
| E230 | `{kw}` needs `{t}` or `{f}`, but got {what}. | `{kw}` necesita `{t}` o `{f}`, pero recibió {what}. |
| E231 | This took too long (more than {n} steps). There may be a loop that never ends. | Esto tardó demasiado (más de {n} pasos). Puede haber un bucle que nunca termina. |
| E232 | Keys can only be removed from a dictionary that has them. `{key}` is not there. | Solo se pueden quitar claves que existen. `{key}` no está. |

## Built-in samples

Programs read these offline sources by name, so lessons work without internet access and every student sees the same data.

- CSV datasets: `sample:students`, `sample:weather_daily`, `sample:login_log`, `sample:phishing_emails`
- Web API samples for `get_json` / `post_json`: `sample:weather`, `sample:countries`, `sample:trivia`, `sample:echo`
- Networks for `load_network`: `sample:home_network`, `sample:internet_small`
- Example programs: Hello and input; Turtle star pattern; Grades with tests and docs; Pets: classes and objects; Data: clean and chart student scores; Network: routing and a firewall; Security: ciphers, hashes, passwords; Screen controls: a greeter app; Sorting: bubble sort step by step; Web data: weather forecast
