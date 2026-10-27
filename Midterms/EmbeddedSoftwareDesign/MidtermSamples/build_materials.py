from pathlib import Path
import json, random, collections, html, re
ROOT=Path(__file__).resolve().parent
BANK=[]
def q(v,l,s,stem,correct,a,b,c,why,calc=None):
    BANK.append(dict(variant=v,lesson=f'{l:02}',slides=s,stem=stem,options=[correct,a,b,c],why=why,calc=calc))
# Each option list starts with the correct answer; the exporter balances and shuffles the keys.
# A: foundations and first full rehearsal.
q('A',0,'4, 5','A Cortex-M program reads a constant array in flash with an ordinary LDR. Which model explains this?',
 'A unified address space for code and data','Separate Harvard spaces requiring LPM','Port-mapped I/O requiring IN','Run-time virtual addresses supplied by an MMU',
 'У Cortex-M единая карта адресов: обычный load читает и RAM, и flash. Отдельные внутренние шины не создают отдельные пространства адресов.')
q('A',0,'10','A word 0xA1B2C3D4 is stored at address a on this STM32. Which bytes appear at a, a+1, a+2, a+3?',
 'D4 C3 B2 A1','A1 B2 C3 D4','B2 A1 D4 C3','C3 D4 A1 B2',
 'Little-endian: младший байт идёт по младшему адресу. Разбиваем слово на A1 B2 C3 D4 и записываем в обратном порядке.',{'type':'endian','word':0xA1B2C3D4})
q('A',0,'8, 3b','A task is in Thread mode with CONTROL.SPSEL=1. An interrupt arrives. Which stack does the handler use to execute?',
 'MSP; the interrupted task hardware frame is placed on PSP','PSP for both the task frame and handler execution','MSP only if CONTROL.nPRIV=1','A new stack allocated by the NVIC',
 'Контекст прерванной задачи аппаратно сохраняется на её PSP. Сам handler исполняется с MSP. Это разные действия при входе в исключение.')
q('A',1,'4','Ignoring address setup and instruction fetches, an aligned RAM counter++ is LDR, ADDS, STR on this core. How many instructions and data-memory accesses are involved?',
 '3 instructions, 2 data accesses','1 instruction, 1 data access','3 instructions, 3 data accesses','2 instructions, 2 data accesses',
 'LDR читает данные, ADDS работает внутри CPU, STR записывает данные. Больше инструкций не означает больше обращений к данным.')
q('A',1,'8, 18','Function f calls g using BL and must later return to its own caller. Why does f save LR before calling g?',
 'BL overwrites LR with the return address from g','BL always pushes LR automatically','LR is a memory-mapped peripheral register','The Thumb bit forbids nested calls',
 'LR хранит один адрес возврата. Вложенный BL заменит его, поэтому non-leaf функция сохраняет свой старый LR, обычно в стеке.')
q('A',1,'7','After CMP r0,r1, the program must branch when unsigned r0 is lower than unsigned r1. Which branch is appropriate?',
 'BCC','BLT','BEQ','BGE',
 'BCC проверяет unsigned lower, то есть отсутствие carry при сравнении. BLT — signed less: для значений с установленным старшим битом результат может отличаться.')
q('A',1,'19','Reset_Handler starts at 0x080004A0. What should its vector-table entry contain?',
 '0x080004A1','0x080004A0','0x080004A4','0x200004A1',
 'В указателе обработчика установлен бит 0, Thumb: 0x080004A0 | 1. Адрес первой инструкции при этом остаётся чётным.',{'type':'thumb','address':0x080004A0})
q('A',2,'4, 5','Assume these non-optimised-away globals: const uint32_t table[4]={1,2,3,4}; uint32_t count; uint32_t limit=7;. Which storage assignment is correct?',
 'table: flash; count: RAM; limit: RAM plus a flash initialiser','All three use RAM only','table and count: flash; limit: RAM only','table: both; count: both; limit: flash only',
 'table попадает в .rodata, count — в .bss, limit — в .data. Только .data требует одновременно рабочую RAM и сохранённые начальные значения во flash.')
q('A',2,'3','main.o calls sensor_read(), but no linked object defines it. What failure should be expected?',
 'Linker: undefined reference to sensor_read','Compiler: multiple definition of sensor_read','HardFault before the linker runs','The linker automatically inserts an empty function',
 'При отдельной компиляции вызов может остаться неразрешённым до link. Если определения нет, linker выдаёт undefined reference; multiple definition означает противоположную проблему.')
q('A',2,'7','An Intel HEX type-04 record sets the upper address to 0x0800. A following data record has offset 0x0120. Where do its data begin?',
 '0x08000120','0x00000920','0x08001200','0x01200800',
 'Type 04 задаёт старшие 16 бит: (0x0800 << 16) + 0x0120 = 0x08000120.',{'type':'hexaddr','upper':0x0800,'offset':0x0120})
q('A',3,'4, 5','Both main and an ISR increment the same volatile uint32_t. Some increments disappear. What is the best explanation?',
 'Volatile forces accesses but does not make read-modify-write atomic','Volatile disables every interrupt','An aligned word always makes counter++ atomic','The compiler is required to ignore volatile at -Os',
 'Сам aligned load/store неделим, но ++ состоит из чтения, изменения и записи. ISR может вклиниться между ними; нужна короткая критическая секция.')
q('A',3,'7','An ISR is the only writer of an aligned volatile uint32_t; main only reads it. Must main mask interrupts solely to prevent a torn read?',
 'No: a single aligned word load sees the old or new value','Yes: every volatile load is split into four byte loads','Yes: only a mutex can read an ISR variable','No, because volatile prevents the ISR from preempting',
 'В условиях задачи один writer и одно выровненное машинное слово. Чтение не разрывается на половины. Volatile нужен для реальных чтений, но сам по себе не запрещает прерывания.')
q('A',3,'5, 8','Why should a critical section implemented with PRIMASK remain very short?',
 'It delays configurable interrupts and increases worst-case latency','It makes the CPU run at 12 MHz','It changes NVIC priorities permanently','It moves all globals from RAM to flash',
 'Пока PRIMASK маскирует настраиваемые исключения, они не обслуживаются. NMI и HardFault этой маской не отключаются.')
q('A',4,'5, 7','The first eight firmware bytes are 00 30 00 20 A1 04 00 08. What are the initial SP and actual Reset_Handler address?',
 'SP=0x20003000; handler=0x080004A0','SP=0x00300020; handler=0xA1040008','SP=0x20003000; handler=0x080004A1','SP=0x080004A0; handler=0x20003000',
 'Декодируем каждую четвёрку little-endian. Второе слово — 0x080004A1; убираем Thumb bit для адреса инструкции.',{'type':'boot','bytes':'00300020a1040008'})
q('A',4,'8','The intended TIM3 handler is accidentally named TIM3_IRQhandler. The build succeeds. The first timer IRQ arrives. What is the likely result?',
 'The vector still selects Default_Handler and the board hangs there','The linker guesses the intended name','The CPU skips this IRQ and continues normally','The compiler repairs the spelling at -Os',
 'Имена символов чувствительны к регистру. Неверное имя не заменяет weak alias; Default_Handler в этом репозитории — бесконечный цикл.')
q('A',4,'16','When increasing the clock from 12 MHz to 48 MHz, which order is safe?',
 'Increase flash wait states, then increase clock frequency','Increase clock frequency, then increase flash wait states','Change SystemCoreClock only; hardware follows it','Disable the vector table, then set the baud rate',
 'Сначала flash должна выдерживать будущую скорость. SystemCoreClock — программная переменная, а не команда переключения генератора.')
q('A',5,'4, 5','Which MODER bits configure PB6, and which two-bit value selects output mode?',
 'Bits 13:12, value 01','Bits 7:6, value 01','Bits 25:24, value 10','Bit 6, value 1',
 'MODER выделяет по два бита на pin: 2*6=12, значит 13:12. Коды: 00 input, 01 output, 10 AF, 11 analog.',{'type':'moder','pin':6})
q('A',5,'12','Which single GPIOB->BSRR value sets PB2 and resets PB7, leaving all other pins unchanged?',
 '0x00800004','0x00000084','0x00040080','0x00800000',
 'Set PB2: 1<<2 = 0x4. Reset PB7: 1<<(7+16)=0x00800000. Объединяем OR.',{'type':'bsrr','set':[2],'reset':[7]})
q('A',5,'14','PA10 must use alternate function 3, as specified in a supplied pin table. Which field receives the value 3?',
 'AFR[1] bits 11:8','AFR[0] bits 21:20','MODER bits 11:8','AFR[1] bits 23:20',
 '10/8=1, 10 mod 8=2; 4*2=8. Поле AFR[1] — 11:8. MODER отдельно должен выбирать AF mode.',{'type':'afr','pin':10,'af':3})
q('A',5,'25','RPR1 has rising pending bits 1 and 4 set. You have handled only line 1. Which statement clears only that line?',
 'EXTI->RPR1 = 1u << 1;','EXTI->RPR1 |= 1u << 1;','EXTI->RPR1 = 0;','EXTI->RPR1 &= ~(1u << 1);',
 'RPR1 — write-1-to-clear. Присваивание пишет 1 только в bit1. |= читает bit4=1 и записывает его обратно, тем самым также очищая необработанный bit4.')
q('A',5,'23, 25, 26','An EXTI falling pending bit is set, IMR1 is unmasked, but its NVIC IRQ is disabled. What follows?',
 'The pending event does not execute the handler until the IRQ can be serviced','The pin automatically changes to analog mode','The event bypasses the NVIC through GPIO->IDR','The linker rewrites the vector table at run time',
 'В цепочке pin → EXTI → NVIC → vector нужны все разрешения. Наличие pending в EXTI ещё не доказывает, что handler может запуститься.')
q('A',6,'2','At a 48 MHz core clock, what LOAD value produces a 2 ms SysTick period using the core clock?',
 '95999','96000','47999','23999',
 '48 000 000 * 0.002 = 96 000 тактов. LOAD хранит ticks-1 = 95 999.',{'type':'systick','clock':48000000,'ms':2})
q('A',6,'5b','A 48 MHz timer must count at 1 MHz and update every 10 ms. Choose PSC and ARR.',
 'PSC=47, ARR=9999','PSC=48, ARR=10000','PSC=47, ARR=1000','PSC=479, ARR=9999',
 'Делитель 48 даёт 1 MHz, значит PSC=47. За 10 ms проходит 10 000 отсчётов: ARR=9999.',{'type':'timer','clock':48000000,'psc':47,'arr':9999,'hz':100})
q('A',6,'3','uint32_t start=0xFFFFFFF0 and now=0x00000020. Using unsigned subtraction, what is now-start, and has a 40 ms timeout expired?',
 '48 ms; yes','32 ms; no','16 ms; no','A negative result; unsigned subtraction is invalid',
 'До нуля от FFFFFFF0 — 16, затем ещё 32: всего 48. Проверка 48>=40 истинна. Предполагается, что не прошло целое дополнительное переполнение.',{'type':'elapsed','start':0xFFFFFFF0,'now':0x20,'period':40})
q('A',6,'7','UIF is a write-0-to-clear timer flag. Which statement clears UIF while preserving other status flags?',
 'TIM3->SR = ~TIM_SR_UIF;','TIM3->SR = TIM_SR_UIF;','TIM3->SR |= TIM_SR_UIF;','TIM3->DIER = TIM_SR_UIF;',
 'Записываем 0 в UIF и 1 в остальные status flags. EXTI-стиль с записью 1 оставит UIF установленным и может вызвать бесконечный вход в ISR.')
q('A',7,'3b, 5','A handler returns using EXC_RETURN=0xFFFFFFFD. What does this request?',
 'Return to Thread mode using PSP','Return to Handler mode using MSP','Jump to the ordinary code address 0xFFFFFFFC','Return to Thread mode using MSP',
 'FD — специальный код exception return, не обычный указатель. Он выбирает Thread mode и PSP; F9 выбирает Thread/MSP.')
q('A',7,'9','READY tasks have kernel priorities 1, 2 and 3. Which runs, and how does this compare with NVIC numbering?',
 'Kernel task 3 runs; NVIC priority 0 is most urgent','Kernel task 1 runs; NVIC priority 3 is most urgent','Both use 0 as most urgent','Both use the largest number as most urgent',
 'В учебном kernel большее число означает более срочную задачу. В NVIC ноль — самый срочный уровень. Это две независимые шкалы.')
q('A',7,'13, 14','Low owns a mutex wanted by High. Medium, which never uses that mutex, keeps preempting Low. What directly addresses this inversion?',
 'Temporarily raise Low to High\'s priority while High waits','Raise Medium above High','Make High spin forever without releasing the CPU','Declare the mutex volatile and change nothing else',
 'Priority inheritance даёт владельцу mutex приоритет ожидающей High. Тогда Medium не задерживает освобождение ресурса; после unlock приоритет возвращается.')
q('A',7,'15','An ISR calls os_queue_put_from_isr() when the queue is full. What does this course API do?',
 'Return 0 immediately','Block the ISR until a task consumes an item','Overwrite the oldest item automatically','Call os_mutex_lock() and sleep',
 'ISR API никогда не блокирует: full → 0. Handler должен учесть потерю или выбрать другую политику; task API в такой ситуации может блокировать задачу.')
q('A',8,'1b, 2','USART clock is 48 MHz, baud is 19200, format is 8N1. What are BRR and the maximum payload-byte rate?',
 'BRR=2500; 1920 bytes/s','BRR=2499; 19200 bytes/s','BRR=2500; 2400 bytes/s','BRR=19200; 2500 bytes/s',
 'BRR=48 000 000/19 200=2500. У 8N1 на байт 10 бит: start+8 data+stop, поэтому 19 200/10=1920 bytes/s.',{'type':'uart','clock':48000000,'baud':19200})
q('A',8,'6','TX ring is empty but TXEIE remains enabled. TXE stays set. What is the likely symptom?',
 'Repeated UART interrupts starve lower-priority work','The baud rate becomes half its value','Only the next received byte is discarded','The UART automatically disables UE',
 'TXE означает свободный TDR, а свободный он и в idle. Если нечего отправлять, ISR должен выключить TXEIE; включить обратно можно при появлении данных.')
q('A',8,'10','ASCII values are L=4C, E=45, D=44, comma=2C, 2=32 (hex). What frame encodes body LED,2?',
 '$LED,2*53','$LED,2*50','$LED,2*32','$LED,2*57',
 '4C^45=09; ^44=4D; ^2C=61; ^32=53. Символы $ и * в checksum не входят.',{'type':'checksum','body':'LED,2','expected':0x53})
q('A',8,'9b','A raw terminal sends bytes ESC [ A. What is the best interpretation?',
 'One Up-arrow key encoded as a three-byte escape sequence','Three ordinary shell commands that must execute separately','A corrupt NMEA checksum','A request to switch the CPU into ARM state',
 'Клавиши могут быть многобайтными. Декодер сохраняет состояние между байтами; ESC [ A — Up. Одиночный ESC отличают ожиданием таймаута.')
# B: different numbers and failure analysis.
q('B',0,'10','A uint32_t load uses address 0x20000002 on actual Cortex-M0+ silicon. What is expected?',
 'HardFault because the word address is not naturally aligned','A correct load with no penalty','Automatic conversion to two safe halfword loads','An undefined-reference linker error',
 'Слову из четырёх байт нужен адрес, кратный четырём. 0x...02 не подходит. Симулятор может моделировать это иначе; вопрос явно о silicon.')
q('B',0,'6, 7','Which pair belongs to the ARM core rather than ST-specific peripheral blocks?',
 'NVIC and SysTick','GPIOA and RCC','USART2 and TIM3','EXTI and GPIOB',
 'NVIC/SysTick описывает документация ARM и core_cm0plus.h. RCC/GPIO/USART/TIM/EXTI — устройство ST, stm32c031xx.h и reference manual.')
q('B',0,'3b, 8','Which access correctly reads PRIMASK on this core?',
 'MRS (or the CMSIS __get_PRIMASK wrapper)','LDR from GPIOA base plus offset 0x20','IN from a dedicated x86-style I/O port','Reading BASEPRI, which is identical on M0+',
 'PRIMASK — специальный core register без memory-mapped адреса. Его читают MRS. BASEPRI у M0+ отсутствует.')
q('B',1,'5','r0=0xFF, r1=0x0C. What does BICS r0,r1 leave in r0?',
 '0xF3','0x0C','0xFF','0x03',
 'BICS — bit clear: FF & ~0C = F3. Это не OR и не обычный AND с маской.',{'type':'bics','x':0xFF,'mask':0x0C})
q('B',1,'6','A 32-bit register holds -8 (0xFFFFFFF8). What does ASRS by 1 produce?',
 '0xFFFFFFFC (-4)','0x7FFFFFFC','0xFFFFFFF0 (-16)','0x00000004',
 'Arithmetic shift сохраняет знак: старший бит заполняется единицей. Logical shift LSRS дал бы 0x7FFFFFFC. Для отрицательных нечётных чисел ASR не равен C-делению с округлением к нулю.',{'type':'asr','x':-8,'shift':1})
q('B',1,'9, 10','The narrow word-load form LDR r0,[r1,#n] has a 5-bit offset scaled by 4. Which offset is directly encodable?',
 '124 bytes','128 bytes','-4 bytes','126 bytes',
 '5 бит дают 0..31, умножаем на 4: 0,4,...,124. Отрицательный и некратный четырём offset этой формой не кодируется.',{'type':'offset','bits':5,'scale':4})
q('B',1,'16, 17','A Cortex-M0+ executes a C unsigned division whose divisor is not a compile-time constant. Which statement fits this core?',
 'It may call __aeabi_uidiv because no hardware divide instruction exists','It must use UDIV because all Cortex-M cores implement it','It switches to ARM state to perform division','It uses the on-chip FPU for integer division',
 'M0+ — Thumb-1 plus six, без divide и FPU. Compiler может использовать runtime helper; M3/M4 имеют другие возможности.')
q('B',2,'1, 2','When are final peripheral and section addresses bound in this bare-metal firmware?',
 'At build/link-and-locate time','Only when a desktop loader starts the process','Continuously through an MMU','Only after printf initialises stdout',
 'Linker script задаёт фиксированную карту при сборке. Здесь нет loader/MMU, которые выбрали бы новую карту при запуске.')
q('B',2,'4, 5','Ignoring padding and all other sections, code uses 900 bytes, rodata 100 bytes, initialised writable globals 40 bytes, zeroed globals 60 bytes, reserved heap/stack 200 bytes. What are flash and RAM totals?',
 'Flash 1040 bytes; RAM 300 bytes','Flash 1000 bytes; RAM 300 bytes','Flash 1100 bytes; RAM 260 bytes','Flash 1040 bytes; RAM 260 bytes',
 'Flash=900+100+40=1040. RAM=40+60+200=300. .data учитывается дважды, .bss во flash не хранится.',{'type':'memory','text':900,'rodata':100,'data':40,'bss':60,'reserve':200})
q('B',2,'7, 9','Which file is normally the most useful to a debugger that needs function names and source-line information?',
 'Main.elf','Main.bin only','A screenshot of the serial monitor','diagram.json',
 'ELF содержит sections, адреса, symbols и debug info. BIN — только байты; HEX — записи байтов и адресов, но не полноценная debug-информация.')
q('B',3,'4','A loop polling an ISR-updated ordinary global works at -O0 and hangs at -Os. What should be checked first?',
 'Whether the shared object needs volatile so the loop reloads it','Whether every variable should be moved to the heap','Whether the ISR should use a larger uint64_t flag','Whether the compiler should silently change the vector number',
 'Без volatile компилятор может сохранить прочитанное значение и не читать его снова. Это проблема видимости accesses, отдельная от RMW-race.')
q('B',3,'7','An ISR updates width and count. Main reads width, gets interrupted, then reads count. Each field is an aligned uint32_t. What can still go wrong?',
 'Main may get an old width paired with a new count','Nothing: two atomic fields guarantee one atomic snapshot','Both reads are forced to return zero','The compiler must automatically insert a mutex',
 'Атомарность каждого слова не даёт согласованности пары. Нужна короткая секция, копирующая оба значения без вмешательства writer.')
q('B',3,'8','IRQ A at NVIC priority 2 is running when IRQ B at priority 1 becomes pending. Interrupts are unmasked. What happens?',
 'B can preempt A','A must finish because 2 is more urgent than 1','B can run only after main returns','The priorities are ignored for nested interrupts',
 'У NVIC меньшее число срочнее. Если B имеет более высокий аппаратный приоритет, он может прервать A. Равный приоритет так не делает.')
q('B',4,'12, 14','The linker defines _sdata as the start of .data. What does the C expression &_sdata provide?',
 'The section-start address assigned by the linker','The first initialised uint32_t value inside .data','An allocation request for a new uint32_t','The size of all RAM',
 'Linker symbol обозначает адрес. В принятом объявлении extern uint32_t _sdata чтение _sdata разыменовало бы этот адрес; & даёт саму границу section.')
q('B',4,'3, 13','RAM begins at 0x20000000 and its declared length is 12 KiB. What is _estack, assuming a descending stack?',
 '0x20003000','0x20002FFF','0x20001200','0x20000000',
 '12*1024=12288=0x3000. Начальный SP указывает сразу за верхней границей RAM; push уменьшает его перед сохранением.',{'type':'stacktop','base':0x20000000,'kib':12})
q('B',4,'6, 20','The linker places .text first and .isr_vector after it, without remapping the vector base. Why can the image fail to boot despite valid HEX checksums?',
 'At reset the core interprets instruction bytes as the initial SP and reset vector','HEX checksums automatically relocate the vector table','The compiler cannot compile C startup code','The CPU searches all flash for a section named .isr_vector',
 'Hardware не знает имён ELF sections. Оно читает два слова по reset mapping. Правильные checksums говорят о целостности записи, а не о верной компоновке.')
q('B',5,'5, 6, 15','GPIOA->MODER starts at 0xEBFFFFFF. Only PA4 is changed to output with clear-then-set. What is the new value?',
 '0xEBFFFDFF','0xEBFFFFFF','0xEBFFFCFF','0x00000100',
 'PA4 — bits9:8, mask=0x300. Очищаем: EBFFFCFF. Ставим 01: OR 0x100 → EBFFFDFF. Одним OR исходное 11 не изменить.',{'type':'modechange','old':0xEBFFFFFF,'pin':4,'mode':1})
q('B',5,'7, 9','Two devices share an open-drain wire with a pull-up. Device A pulls low, device B releases. What level is on the wire?',
 'Low; any device pulling low wins','High because the pull-up always wins','Undefined because open-drain actively drives high','A direct high-versus-low output short is unavoidable',
 'Open-drain активно тянет только вниз. Если хотя бы один участник тянет low, линия low; high появляется, когда отпускают все. Это wired-AND.')
q('B',5,'24','EXTI line 13 must monitor PC13. The supplied port code is C=2. Which field should contain 2?',
 'EXTI->EXTICR[3] bits 15:8','EXTI->EXTICR[1] bits 27:26','GPIOC->AFR[1] bits 15:8','NVIC->IPR[3] bits 15:8',
 'У C0 EXTICR находится в EXTI. 13/4=3, 13 mod4=1; байт начинается с bit8. Port code занимает младшие биты этого байта.',{'type':'exticr','line':13,'port':2})
q('B',5,'26','For external IRQ 6 at logical NVIC priority 1, which priority word and encoded word contribution are correct?',
 'IPR[1], contribution 0x00400000','IPR[6], contribution 0x00000001','IPR[1], contribution 0x00004000','IPR[0], contribution 0x40000000',
 '6/4=1 → IPR[1]; byte6mod4=2 → shift16. Encoded byte=1<<6=0x40; 0x40<<16=0x00400000.',{'type':'priority','irq':6,'prio':1})
q('B',5,'20, 21','In the lesson debouncer, a changed sample sets held=0; each subsequent unchanged 1 ms sample increments held. With DEBOUNCE_MS=3, last raw change at t=10 ms and no later changes, when is the new stable state accepted?',
 't=13 ms','t=10 ms','t=11 ms','t=12 ms',
 'В t10 сработал reset held=0; t11→1, t12→2, t13→3 и accept. Вопрос задаёт именно алгоритм курса, чтобы не было неоднозначного счёта samples.',{'type':'debounce','last':10,'n':3})
q('B',6,'6','PSC is written while the timer is stopped. No update event is generated before starting. What can be wrong with the first period?',
 'The old active prescaler may be used until the first update','The timer permanently loses its counter','The write automatically changes the CPU clock','No timer register can be buffered',
 'PSC буферизован. EGR=UG принудительно переносит новый делитель в активную часть; после UG нужно очистить поднятый UIF перед включением interrupt.')
q('B',6,'8, 9','A PWM timer counts at 1 MHz with ARR=19999 and CCR1=1500, active-high PWM mode 1. What waveform results?',
 '50 Hz frames with a 1.5 ms high pulse (7.5% duty)','1500 Hz frames with a 20 ms high pulse','50 Hz with a 15 ms high pulse (75% duty)','1 MHz frames with a 1500 ms high pulse',
 'Период=(19999+1) us=20 ms, частота50 Hz. High пока CNT<1500: 1500 us. Duty=1500/20000=7.5%.',{'type':'pwm','counter':1000000,'arr':19999,'ccr':1500})
q('B',6,'12, 13','A 16-bit capture timer counts at 1 MHz. Rising capture is 65000, falling capture is 464. The pulse is shorter than one full wrap. What is its width?',
 '1000 microseconds','64536 microseconds','464 microseconds','A negative width that cannot be recovered',
 '(464-65000) mod65536=1000. Приведение к uint16_t оставляет результат по модулю16 бит; при одном микросекундном tick это1000 us.',{'type':'capture','rise':65000,'fall':464})
q('B',6,'1, 2','The main loop ignores a polled SysTick COUNTFLAG for 5 wrap periods, then reads it once. What can the flag tell it?',
 'At least one wrap occurred, not that exactly five occurred','The exact count five stored in COUNTFLAG','The addresses of all missed handlers','That no wraps occurred because no reads were made',
 'COUNTFLAG — один sticky bit, не очередь и не счётчик. Он теряет кратность событий. ISR tick тоже требует своевременного обслуживания: pending не хранит бесконечное число ticks.')
q('B',7,'4b, 4c','An ISR makes a higher-priority task READY. Why is PendSV requested instead of swapping task context immediately inside that ISR?',
 'The switch is deferred until active handlers finish; PendSV has lowest priority','PendSV recompiles the selected task','The ISR must first copy all program flash to RAM','Only PendSV can change a GPIO mode',
 'schedule выбирает задачу, PendSV выполняет переключение. Низший приоритет не даёт подменять task context внутри незавершённого другого handler.')
q('B',7,'5, 7','Which registers does PendSV save in addition to the eight-word hardware exception frame?',
 'r4-r11','r0-r3 only','Only PC and xPSR','All peripheral registers including GPIO and UART',
 'Hardware сохраняет r0-r3,r12,lr,pc,xPSR. Оставшиеся callee-saved r4-r11 сохраняет kernel. В Thumb-1 high regs проходят через low regs.')
q('B',7,'9, 10','A priority-3 task stays READY and busy-waits forever with interrupts enabled. A priority-1 task is READY. Which statement is correct for this kernel?',
 'The lower-priority task can starve; preemption alone does not guarantee it CPU time','The tick guarantees every priority exactly one equal time slice','Busy-wait automatically marks the task SLEEPING','NVIC priority 1 makes the priority-1 task run first',
 'Round-robin действует между равными task priorities. Высокоприоритетная READY задача не уступает низкоприоритетной только из-за tick; для ожидания нужны block/sleep.')
q('B',7,'16, 17','A stack contains 128 words. After exercising the task, 20 bottom words still contain the fill pattern and the remaining words have been touched. What is the measured maximum used space?',
 '108 words, or 432 bytes','20 words, or 80 bytes','128 bytes','The method proves future overflow is impossible',
 'Used=128-20=108 words. uint32_t word=4 bytes →432. Это наблюдавшийся максимум, не гарантия для непроверенных путей.',{'type':'watermark','words':128,'untouched':20})
q('B',8,'4','Which pair correctly clears RXNE and ORE in the lesson UART?',
 'Read RDR for RXNE; write ORECF=1 to ICR for ORE','Write 0 to ISR for both','Write 1 to RDR for RXNE; read BRR for ORE','Read TDR for RXNE; write 0 to CR1 for ORE',
 'Флаг приёма уходит при чтении data register RDR. Overrun очищается записью1 в отдельный clear register ICR, а не записью в ISR.')
q('B',8,'5','A 256-slot TX ring leaves one slot unused so head==tail can mean empty. How many bytes can it hold, and what must the producer publish first?',
 '255 bytes; the byte data before the new head','256 bytes; the head before the data','255 bytes; the tail before the data','128 bytes; head and tail simultaneously',
 'Один пустой slot различает full и empty, значит capacity=255. Сначала данные, затем индекс; иначе consumer может прочитать ещё не заполненный slot.',{'type':'ring','slots':256})
q('B',8,'8, 9','Two tasks can call printf. Why does the lesson wrap complete output operations in a print mutex?',
 'To serialize producers, prevent interleaved lines and protect non-reentrant printf state','To disable all UART interrupts for the full line duration','To make XOR detect every possible multi-bit error','To change 8N1 to 9N1 automatically',
 'Несколько tasks без сериализации — несколько writers head, что нарушает SPSC-предпосылку. say() делает вывод согласованным и защищает общее состояние newlib-nano.')
q('B',8,'9b','The decoder has received only ESC, and no continuation has arrived for longer than its 50 ms threshold. Why wait instead of immediately reporting a standalone Esc?',
 'ESC may be the prefix of a multibyte key sequence','The UART needs 50 ms to transmit every byte at 115200','Every ESC byte is an EXTI interrupt','NMEA requires exactly 50 checksum bytes',
 'Один и тот же ESC начинает arrows/CSI и обозначает отдельную клавишу. Пока не пришёл следующий байт, их различает время. В коде key_timeout событие наступает при elapsed>50, а не ровно50.')
# C: synthesis and harder distractors.
q('C',0,'5, 11','A peripheral control register reads back 0 and ignores writes. The code builds cleanly. Which missing step is the first suspect?',
 'Enable its RCC peripheral clock gate','Add a printf before every access','Mark the entire flash memory writable','Insert a desktop system call to request an I/O port',
 'Без clock gate периферия в модели курса не отвечает на конфигурацию. Сначала clock, потом configure, потом use. Clean build не доказывает работу hardware.')
q('C',0,'3b, 9','While USART2_IRQHandler runs, USART2 has external IRQ number 28. What exception number is reported by IPSR?',
 '44','28','12','112',
 'Первые16 vector slots принадлежат core. Exception/vector number =16+IRQ=44=0x2C. IRQ number и exception number не одно и то же.',{'type':'exception','irq':28})
q('C',0,'8','Why can one task\'s bad pointer silently corrupt another task\'s data on this MCU?',
 'Tasks share a physical address space without an MMU providing private virtual maps','The RTOS converts every pointer to a safe virtual address','Every task receives its own separate RAM chip','All misdirected writes are guaranteed to become segmentation faults',
 'Отдельные стеки не создают отдельные address spaces. Без настроенной аппаратной защиты ошибочная запись в существующую RAM может повредить соседа; unmapped адрес может fault.')
q('C',1,'7','r0=0xFFFFFFFF and r1=1. After CMP r0,r1, which statement about BLT and BCC is correct?',
 'BLT is taken; BCC is not taken','Both are taken','Neither is taken','BCC is taken; BLT is not taken',
 'Signed: FFFFFFFF=-1, и -1<1. Unsigned:4294967295>1. Поэтому signed BLT и unsigned BCC расходятся.',{'type':'compare','a':0xFFFFFFFF,'b':1})
q('C',1,'18','An assembly function uses r0 and r4 as temporary registers. Under the taught AAPCS convention, what must it restore before returning?',
 'r4; r0 is caller-saved and may carry the result','Both r0 and r4 must always retain their entry values','Neither register because all registers are caller-saved','Only r0; r4 is always scratch',
 'r0-r3 и r12 — scratch/caller-saved; r4-r11 — callee-saved в соглашении курса. Возврат обычного 32-битного результата происходит через r0.')
q('C',1,'9, 12','What does LDR r2,[PC,#offset] commonly do when loading a large peripheral base address on M0+?',
 'Read a 32-bit constant from a nearby literal pool','Store the PC into a peripheral register','Switch from Thumb to ARM instructions','Ask the linker to allocate a new register at run time',
 'Полная 32-битная константа не помещается в 16-битную instruction. Literal pool хранит слово рядом с кодом; PC-relative load достаёт его.')
q('C',1,'8, 20','A four-byte BL is located at 0x08000120. What LR value does it create, and where does an ordinary BX LR return?',
 'LR=0x08000125; return instruction at 0x08000124','LR=0x08000121; return instruction at 0x08000120','LR=0x08000124; return instruction at 0x08000125','LR=0x08000128; return instruction at 0x08000128',
 'Следующая instruction начинается после4 байт:124. LR содержит next|1=125. BX использует bit0 как Thumb-признак, а адресом становится124.',{'type':'bl','address':0x08000120})
q('C',2,'3','Two ordinary source files both provide strong definitions of int sensor_read(void). Neither is static. What happens when they are linked together?',
 'A multiple-definition link error','The first alphabetically is silently selected','The CPU chooses one randomly at reset','The definitions become weak automatically',
 'Две внешние strong definitions одного символа конфликтуют. Weak/strong override — другой, явно объявленный механизм.')
q('C',2,'5, 8','The startup routine skips .bss zeroing. What is guaranteed about a .bss counter when main begins?',
 'Its promised zero initial value is no longer guaranteed','It is guaranteed to equal its last flash initialiser','It must always equal 0xFFFFFFFF','The C compiler inserts zeroing into every later read',
 'В bare-metal исполнении обещание C обеспечивает startup. RAM может сохранить старое содержимое или иметь случайное; наблюдаемое0 на одном старте не исправляет bug.')
q('C',2,'1, 7, 9','Which sequence best describes the firmware build and use of a simulator?',
 'Preprocess, compile, assemble, link/locate; then the simulator executes the image','Wokwi first compiles every C file, then the linker simulates the board','The HEX file is C source that the CPU compiles on reset','Renode replaces the need for a compiler and a linker script',
 'Симуляторы исполняют готовую firmware. Получение .o и размещение sections — задача toolchain; ни Wokwi, ни Renode не заменяет эти build stages.')
q('C',3,'1','Which statement best distinguishes polling, interrupts and DMA at the level used in this course?',
 'Polling checks readiness; an interrupt invokes a handler; DMA transfers data without a CPU instruction per item','DMA means that every byte must be copied by the ISR','Polling always outperforms the other two in CPU use','Interrupts mean the peripheral can never miss a second event',
 'DMA требует настройки и обработки завершения, но убирает CPU из переноса каждого элемента. Ни interrupts, ни polling не дают бесконечный буфер или гарантию при любой нагрузке.')
q('C',3,'5','Why does disabling interrupts on core A fail to protect shared data from core B on a dual-core system?',
 'PRIMASK affects local interrupt handling, not execution on the other core','PRIMASK disables writes to RAM globally','Core B has no registers','Volatile automatically stops core B instead',
 'Masking даёт исключение конкурента на одном core. Другой core продолжает работу; нужны подходящие межъядерные atomics/locks. Сам учебный M0+ — single-core.')
q('C',3,'5','A reusable critical-section helper may be called while interrupts are already disabled. What is the correct exit policy?',
 'Restore the saved PRIMASK value','Always call __enable_irq(), even for a nested section','Always leave PRIMASK at 1','Set CONTROL.SPSEL instead of restoring the mask',
 'enter/leave в os.c сохраняет старую маску. Безусловный enable из внутренней секции преждевременно нарушил бы защиту внешней. Для simple snippets с парой disable/enable предполагается известное исходное состояние.')
q('C',4,'6, 8','Why is a correctly named ordinary handler selected instead of the default weak alias?',
 'Its strong symbol overrides the weak symbol during linking','The NVIC parses C function names at run time','The CPU searches source files on each interrupt','volatile on the function makes it higher priority',
 'Замена происходит у linker, который заполняет таблицу адресом strong definition. NVIC не знает ни C, ни имён функций.')
q('C',4,'10, 14','What does .data >RAM AT>FLASH express in the linker script?',
 'Run-time address in RAM, load image stored in flash','Execute all .data bytes as instructions in flash','Use RAM only, with no nonvolatile initial values','Delay address binding until an MMU maps the section',
 'VMA — рабочий RAM address; LMA — flash address исходного образа. Startup копирует между ними. Это не desktop virtual memory.')
q('C',4,'4c, 17','printf is linked successfully but the serial port stays silent. Which supplied function is the C-library-to-UART output bridge?',
 '_write','main','NVIC_EnableIRQ','__get_PRIMASK',
 'В этой newlib-среде printf вызывает _write. Сначала он polled, в lesson08 заменяется strong buffered implementation. Также нужно проверить UART init и _sbrk.')
q('C',5,'5, 15','A pin\'s MODER field is currently 11. Software executes MODER |= (1u << (2*n)) hoping to select output 01. What mode remains in that field?',
 '11 (analog)','01 (output)','00 (input)','10 (alternate function)',
 'OR не очищает единицы:11|01=11. Сначала AND с инверсной2-битной маской, потом OR нового кода. Остальные поля нужно сохранить.')
q('C',5,'24','Which GPIO interrupt-source pair cannot both be selected at the same time through EXTI?',
 'PA2 and PB2','PA2 and PB3','PA0 and PB7','PA1 and PA6',
 'У line2 один port-select: она выбирает pin2 только одного порта. Разные номера pins используют разные линии; общий handler сам по себе не запрещает несколько линий.')
q('C',5,'27','External IRQ number is 19 and the vector table starts at 0x08000000. At what address is this IRQ\'s vector word?',
 '0x0800008C','0x0800004C','0x08000023','0x08000088',
 'Vector=16+19=35. Смещение=35*4=140=0x8C. Таблица хранит адрес handler, а вычисленное значение — адрес самого vector word.',{'type':'vector','irq':19,'base':0x08000000})
q('C',5,'9, 10, 19','GPIOA->IDR reads 0x00000008. PA3 is a digital input with a pull-up and a button to GND. Is the button pressed?',
 'No; bit 3 is 1, so the active-low button is released','Yes; every set IDR bit means pressed','Impossible because a pull-up forces a permanent 0','Yes; 0x8 selects analog mode',
 '0x8=1<<3 → pin high. Кнопка active-low: pressed означает0. IDR даёт уровень, MODER задаёт режим.',{'type':'button','idr':8,'pin':3})
q('C',5,'29, 31','A button press produces many bounce edges. Which handler design matches the lesson?',
 'Clear pending flags, record edges, return; decide stable state outside the ISR','Wait 20 ms inside the ISR, then leave all pending bits set','Treat each falling bounce edge as a separate user press','Disable SysTick permanently to make the contact stable',
 'Handler должен быть коротким. Debounce ждёт20 ms тишины в main/task; ожидание в ISR задержит равные и менее срочные interrupts.')
q('C',6,'4','A periodic job runs 3 ms late once. Why does last += period preserve timing better than last = now?',
 'It keeps future deadlines on the original time grid','It guarantees that every job always finishes before its deadline','It makes unsigned wrap impossible','It changes a cooperative loop into a preemptive kernel',
 '+=period не переносит всю сетку вслед за разовым опозданием. Сам пропущенный deadline это не отменяет; долгий job по-прежнему задерживает superloop.')
q('C',6,'5b, 8','A 48 MHz timer uses PSC=479 and ARR=999. In active-high PWM mode 1 with CCR1=250, what are the update frequency and high-pulse width?',
 '100 Hz and 2.5 ms','100 Hz and 250 microseconds','50 Hz and 5 ms','1000 Hz and 2.5 ms',
 'Counter=48 MHz/480=100 kHz →10 us/count. Period=1000*10 us=10 ms →100 Hz. High=250*10 us=2.5 ms.',{'type':'timerpwm','clock':48000000,'psc':479,'arr':999,'ccr':250})
q('C',6,'10, 12, 13b','A hardware timer runs and IRQ counts look right, but its PWM pin has no signal. Which configuration is a strong suspect?',
 'Wrong alternate-function selection or a disabled channel output','Missing volatile on a constant lookup table','A signed branch in the Python host','A type-04 HEX record always disables PWM',
 'Работающий counter не гарантирует связь channel→pin. Проверяем CCER.CC1E, MODER=AF, AFR и wiring. Аналогично отсутствие capture в Wokwi — ограничение модели, не доказательство неверной формулы.')
q('C',6,'12, 13','Why is real hardware input capture more accurate than taking a timer reading after entering an EXTI ISR?',
 'Hardware latches CNT at the edge before ISR latency occurs','Capture disables every other interrupt permanently','Capture uses the wall-clock time on the Python host','An ISR can always run at zero latency',
 'ISR читает уже сохранённый CCR timestamp. При EXTI счётчик читается позже на величину latency; различная задержка двух edges искажает width. Capture всё равно нужно прочесть до overwrite.')
q('C',7,'8','A new task is started from a fabricated exception frame. Which xPSR value sets the required Thumb T bit?',
 '0x01000000','0x00000001','0x10000000','0x00000000',
 'У xPSR T расположен в bit24:1<<24=0x01000000. Это не bit0 function pointer; при exception return состояние Thumb восстанавливается из frame.',{'type':'xpsr','bit':24})
q('C',7,'9, 10','Two tasks at the highest READY kernel priority are CPU-bound and never block; all others are lower priority. What scheduling policy applies to those two?',
 'Round-robin time slicing among equals','Run-to-completion with no preemption','Always select the task with the lower RAM address','Give the lower-priority tasks an equal slice after each one',
 'pick начинает поиск после current и заменяет best только строго большим priority. Поэтому равные highest READY tasks чередуются; low priorities могут ждать.')
q('C',7,'10, 12','Which state best describes a task waiting for a held mutex, and which describes a task waiting for a time delay?',
 'Mutex: BLOCKED; delay: SLEEPING','Mutex: SLEEPING; delay: BLOCKED','Both must spin in READY state','Both execute in Handler mode on MSP',
 'В модели kernel BLOCKED означает ожидание объекта, SLEEPING — ожидание wake time. Обе задачи пока не используют CPU; running обозначается current среди READY.')
q('C',7,'18','A HardFault frame has eight uint32_t words, indexed from 0. Which frame index gives the saved PC, and what does EXC_RETURN bit 2 select?',
 'Index 6; PSP when bit 2 is 1, otherwise MSP','Index 7; the UART baud rate','Index 0; Thread versus Handler priority number','Index 4; flash versus SRAM execution',
 'Порядок hardware frame:r0,r1,r2,r3,r12,lr,pc,xPSR. PC — index6. LR исключения определяет стек frame; addr2line затем связывает PC со строкой исходника.')
q('C',8,'2, 3','A continuous 8N1 stream arrives at 100000 baud. Ignoring other buffering, how much time is there per incoming byte, and how long does an initially empty 64-byte queue absorb it without a consumer?',
 '100 microseconds per byte; about 6.4 ms for 64 bytes','10 microseconds per byte; about 0.64 ms','80 microseconds per byte; about 5.12 ms','1 millisecond per byte; about 64 ms',
 '8N1=10 bits/byte.10/100000=100 us;64*100 us=6.4 ms. ISR всё равно должен вовремя снимать каждый hardware byte; queue лишь даёт task запас.',{'type':'queuewire','baud':100000,'capacity':64})
q('C',8,'10','Two transmitted body bytes both have bit 0 flipped, and the transmitted XOR checksum bytes are unchanged. What can happen?',
 'The two XOR changes cancel and the corrupted body passes this checksum','Every such pair is guaranteed to be rejected','XOR automatically corrects both bytes','The receiver discovers the original bytes from the checksum',
 'XOR дельта равна01^01=00. Checksum обнаруживает любой одиночный bit flip, но не все комбинации ошибок; он не восстанавливает данные.')
q('C',8,'9, 9b','Why are machine lines beginning with $ not echoed, and why is telemetry paused while a human is typing?',
 'To avoid treating echoed commands as received frames and mixing telemetry into partial shell lines','To double the physical UART baud rate','To disable checksum validation for human input','Because GPIO cannot send data while a key is held',
 'На одной UART-линии сосуществуют shell и framed protocol. Эхо $frame могло бы выглядеть как ответ board, а telemetry посреди набираемой строки разрушила бы разметку.')
q('C',8,'12, 13','The host accepts valid TEL frames with sequence numbers 10 and then 13. What gap is inferred, and what does it prove?',
 'Two sequence numbers are missing; it does not identify the physical cause','Three missing frames; both must be UART overruns','One missing frame; XOR corrected the other','No loss is inferred because both received checksums passed',
 '13-10-1=2: отсутствуют11 и12. Sequence gaps показывают недоставленные валидные frames, но не различают повреждение, drop, disconnect и другие причины.',{'type':'gap','previous':10,'current':13})

LESSONS=['00_Architecture','01_Instruction_Set','02_Development','03_Execution_Concurrency','04_Startup_And_LinkerScript','05_GPIO_And_Interrupts','06_Time_And_Timers','07_RTOS','08_UART_And_Python_Host']
EXPECTED=[3,4,3,3,3,5,4,4,4]
for variant in 'ABC':
    qs=[x for x in BANK if x['variant']==variant]
    assert len(qs)==33,(variant,len(qs))
    assert [sum(x['lesson']==f'{l:02}' for x in qs) for l in range(9)]==EXPECTED
    rng=random.Random(3050+ord(variant))
    positions=[i%4 for i in range(33)]; rng.shuffle(positions)
    for n,(x,pos) in enumerate(zip(qs,positions),1):
        correct=x['options'][0]; wrong=x['options'][1:];rng.shuffle(wrong);wrong.insert(pos,correct)
        x['options']=wrong;x['answer']=pos;x['id']=f'{variant}{n:02}';x['number']=n
        x['source']=f'https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/{LESSONS[int(x["lesson"])]}/Slide.md'
        assert len(set(x['options']))==4
(ROOT/'question-bank.json').write_text(json.dumps(BANK,ensure_ascii=False,indent=2)+'\n')
for v in 'ABC':
    qs=[x for x in BANK if x['variant']==v]
    exam=[f'# SOC3050 — Practice Midterm {v}', '', 'Original practice questions based on the ARM 2026 course. Not an official or recovered exam.', '', '**60 minutes · 33 questions · one correct answer A–D · 1 mark each · no calculator or notes.**', '', 'Target: STM32C031C6, Cortex-M0+. Assume unsigned 32-bit arithmetic where uint32_t is stated; 48 MHz unless a different clock is specified. Pin AF codes and IRQ numbers are supplied when needed.', '', 'Name: ____________________  Section: __________  Date: __________', '', '## Answer sheet', '', '| Questions | Answers |','|---|---|']
    for start in range(1,34,11):exam.append('| '+', '.join(str(i) for i in range(start,start+11))+' | '+' '.join(f'{i}:___' for i in range(start,start+11))+' |')
    exam+=['','## Questions','']
    keys=[f'# SOC3050 — Answers and explanations {v}', '', f'Сначала реши [вариант {v}](Sample-{v}.md), затем проверь ответы. Это авторская тренировка по исходникам курса, а не прогноз реальных вопросов.', '', '## Quick key', '', '| Question | Answer | Lesson |','|---|---|---|']
    for x in qs:
        exam += [f'### {x["number"]}.', '', x['stem'],''] + [f'{"ABCD"[i]}. {o}\n' for i,o in enumerate(x['options'])]+['']
        keys.append(f'| {x["number"]} | {"ABCD"[x["answer"]]} | {x["lesson"]} |')
    keys+=['','## Разбор','']
    for x in qs:
        keys += [f'### {x["number"]}. {"ABCD"[x["answer"]]} — lesson {x["lesson"]}', '',f'**Ответ:** {x["options"][x["answer"]]}', '',x['why'],'',f'**Источник:** [Lesson {x["lesson"]}, slides {x["slides"]}]({x["source"]}).','']
    keys+=['## Как использовать результат','','Каждая ошибка — повод вернуться к указанному слайду и объяснить механизм своими словами. Балл здесь — диагностика, не прогноз оценки. Повторяй вопросы после разбора без подсматривания.','']
    (ROOT/f'Sample-{v}.md').write_text('\n'.join(exam).rstrip()+'\n')
    (ROOT/f'Answers-{v}.md').write_text('\n'.join(keys).rstrip()+'\n')
print('Generated',len(BANK),'questions in three 33-question variants')
