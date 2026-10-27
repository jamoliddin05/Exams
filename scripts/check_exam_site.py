#!/usr/bin/env python3
"""Check built-site internal links, anchors and the 99-question trainer payload."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import argparse,json
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag in ['a','link','script','img']:
   for k in ['href','src']:
    if k in a:self.links.append(a[k])
def check(root):
 root=root.resolve();pages={}
 for p in root.rglob('*.html'):
  page=Page();page.feed(p.read_text());pages[p]=page
 assert pages,'No HTML pages built'
 for p,page in pages.items():
  for link in page.links:
   u=urlsplit(link)
   if u.scheme or u.netloc:continue
   target=(p.parent/unquote(u.path)).resolve() if u.path else p
   assert target.is_relative_to(root),(p,link,'outside output')
   assert target.exists(),(p,link,'missing file')
   if u.fragment and target in pages:assert unquote(u.fragment) in pages[target].ids,(p,link,'missing anchor')
 bank=json.loads((root/'embedded/question-bank.json').read_text());assert len(bank)==99
 from collections import Counter
 assert Counter(x['variant'] for x in bank)==dict(A=33,B=33,C=33)
 trainer=(root/'embedded/Trainer.html').read_text()
 assert 'Study-guide-RU.html' in trainer and 'href="index.html"' in trainer
 assert '/home/' not in ''.join(p.read_text() for p in pages)
 print(f'PASS: {len(pages)} pages; internal links and anchors; 99-question payload; portable paths')
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('site',type=Path);check(p.parse_args().site)
