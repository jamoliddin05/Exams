from pathlib import Path
import json, collections, struct, importlib.util, subprocess, tempfile, re, sys
sys.dont_write_bytecode=True
from fractions import Fraction
R=Path(__file__).resolve().parent
B=json.loads((R/'question-bank.json').read_text())
assert len(B)==99 and len({q['id'] for q in B})==99
for v in 'ABC':
 qs=[q for q in B if q['variant']==v]
 assert len(qs)==33
 assert sorted(q['number'] for q in qs)==list(range(1,34))
 assert [sum(q['lesson']==f'{i:02}' for q in qs) for i in range(9)]==[3,4,3,3,3,5,4,4,4]
 assert sorted(collections.Counter(q['answer'] for q in qs).values())==[8,8,8,9]
for q in B:
 assert len(q['options'])==len(set(q['options']))==4
 assert q['source'].startswith('https://github.com/gnoejh/soc3050code/blob/7906b2fdc7895f9656402033bb5af66f5fd3eee8/projects2026_arm/')
 c=q['calc'];res=None; ans=q['options'][q['answer']]
 if not c:continue
 t=c['type']
 if t=='endian':res=struct.pack('<I',c['word']).hex(' ').upper();assert res==ans
 elif t=='thumb':res=f'0x{c["address"]|1:08X}';assert res==ans
 elif t=='hexaddr':res=f'0x{(c["upper"]<<16)+c["offset"]:08X}';assert res==ans
 elif t=='boot':
  sp,pc=struct.unpack('<II',bytes.fromhex(c['bytes']));res=f'SP=0x{sp:08X}; handler=0x{pc&~1:08X}';assert res==ans
 elif t=='moder':res=f'Bits {2*c["pin"]+1}:{2*c["pin"]}, value 01';assert res==ans
 elif t=='bsrr':res=f'0x{sum(1<<n for n in c["set"])+sum(1<<(n+16) for n in c["reset"]):08X}';assert res==ans
 elif t=='afr':
  pin=c['pin'];lo=4*(pin%8);res=f'AFR[{pin//8}] bits {lo+3}:{lo}';assert res==ans
 elif t=='systick':res=str(c['clock']*c['ms']//1000-1);assert res==ans
 elif t=='timer':res=Fraction(c['clock'],(c['psc']+1)*(c['arr']+1));assert res==c['hz'] and Fraction(c['clock'],c['psc']+1)==1000000;res=f'{res} Hz; PSC={c["psc"]}, ARR={c["arr"]}'
 elif t=='elapsed':res=(c['now']-c['start'])%2**32;assert res==48 and res>=c['period'];res=f'{res} ms, timeout expired'
 elif t=='uart':res=f'BRR={round(c["clock"]/c["baud"])}; {c["baud"]//10} bytes/s';assert res==ans
 elif t=='checksum':
  n=0
  for b in c['body'].encode('ascii'):n^=b
  assert n==c['expected'];res=f'${c["body"]}*{n:02X}';assert res==ans
 elif t=='bics':res=f'0x{c["x"]&~c["mask"]:02X}';assert res==ans
 elif t=='asr':v=c['x']>>c['shift'];res=f'0x{v&0xFFFFFFFF:08X} ({v})';assert res==ans
 elif t=='offset':res=f'{((1<<c["bits"])-1)*c["scale"]} bytes';assert res==ans
 elif t=='memory':res=f'Flash {c["text"]+c["rodata"]+c["data"]} bytes; RAM {c["data"]+c["bss"]+c["reserve"]} bytes';assert res==ans
 elif t=='stacktop':res=f'0x{c["base"]+c["kib"]*1024:08X}';assert res==ans
 elif t=='modechange':res=f'0x{(c["old"]&~(3<<(2*c["pin"])))|(c["mode"]<<(2*c["pin"])):08X}';assert res==ans
 elif t=='exticr':res=f'EXTI->EXTICR[{c["line"]//4}] bits {8*(c["line"]%4)+7}:{8*(c["line"]%4)}';assert res==ans
 elif t=='priority':res=f'IPR[{c["irq"]//4}], contribution 0x{(c["prio"]<<6)<<(8*(c["irq"]%4)):08X}';assert res==ans
 elif t=='debounce':res=f't={c["last"]+c["n"]} ms';assert res==ans
 elif t=='pwm':
  rate=Fraction(c['counter'],c['arr']+1);ms=Fraction(c['ccr']*1000,c['counter']);duty=Fraction(100*c['ccr'],c['arr']+1);assert(rate,ms,duty)==(50,Fraction(3,2),Fraction(15,2));res=f'{rate} Hz, {float(ms)} ms, {float(duty)}%'
 elif t=='capture':res=(c['fall']-c['rise'])%2**16;assert res==1000;res=f'{res} microseconds'
 elif t=='watermark':w=c['words']-c['untouched'];res=f'{w} words, or {w*4} bytes';assert res==ans
 elif t=='ring':res=c['slots']-1;assert str(res) in ans;res=f'{res} bytes'
 elif t=='exception':res=str(c['irq']+16);assert res==ans
 elif t=='compare':
  a,b=c['a'],c['b'];signed=lambda x:x if x<2**31 else x-2**32;res=f'signed lower={signed(a)<signed(b)}, unsigned lower={a<b}';assert signed(a)<signed(b) and not a<b
 elif t=='bl':n=c['address']+4;res=f'LR=0x{n|1:08X}; return instruction at 0x{n:08X}';assert res==ans
 elif t=='vector':res=f'0x{c["base"]+4*(c["irq"]+16):08X}';assert res==ans
 elif t=='button':res=(c['idr']>>c['pin'])&1;assert res==1;res='IDR bit=1, released'
 elif t=='timerpwm':
  hz=Fraction(c['clock'],(c['psc']+1)*(c['arr']+1));ms=Fraction(1000*c['ccr']*(c['psc']+1),c['clock']);assert(hz,ms)==(100,Fraction(5,2));res=f'{hz} Hz and {float(ms)} ms'
 elif t=='xpsr':res=f'0x{1<<c["bit"]:08X}';assert res==ans
 elif t=='queuewire':us=Fraction(10*10**6,c['baud']);ms=us*c['capacity']/1000;assert(us,ms)==(100,Fraction(32,5));res=f'{us} us/byte, {float(ms)} ms for queue'
 elif t=='gap':res=c['current']-c['previous']-1;assert res==2;res=f'{res} missing sequence numbers'
 else:raise ValueError(t)

# Check all local Markdown links, including links to original material.
for p in R.glob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if target.startswith(('http:','https:','#')):continue
  assert (p.parent/target.split('#')[0]).exists(),(p,target)
print(f'PASS: {len(B)} questions; 34 numerical checks; distribution; unique options; source URLs; Markdown links')
