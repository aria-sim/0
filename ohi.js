/*
 * Author : Ho-Seok Ee <hsee@korea.ac.kr>
 * Release: 2006/07/18
 * Update : 2011/01/22

 * Modifier : Pat-al <pat@pat.im> (http://pat.im)
 * Added support for Hangeul keyboard layouts including 3-90, 3-2011, 3-2012, Sin-Sebeol 2003/2012 and North Korea 2-sets type(KPS 9256).
 * Added support for Dvorak and Colemak keyboard layouts.
 * Added support for Firefox 12 and higher.
 * Added on-screen keyboard.
 * Last Update : 2014/05/17

 Copyright (C) Ho-Seok Ee <hsee@korea.ac.kr> & Pat-al <pat@pat.im>. All rights reserved.
 
  This program is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License as
  published by the Free Software Foundation; either version 2 of
  the License, or (at your option) any later version.
 
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.
 
  The license can be found at http://www.gnu.org/licenses/gpl.txt.
*/

var En_type='qwerty';
var K2_type='ksx5002';
var K3_type='3-2012';
var ohi_KE_Status='En';

var ohiQ = Array(0,0,0,0,0,0);
var ohiStatus = document.createElement('a');
var ohiTimeout=0;
var diphthong=0;	// 신세벌 자판에서 겹홀소리에 들어가는 ㅗ,ㅜ가 들어갔는지를 알리는 변수
var ohiHangeul3_SignExtKey1=0;	// 3-2011,3-2012 자판 왼쪽 기호 확장 글쇠 누른 횟수, 신세벌 확장 기호 상태
var ohiHangeul3_SignExtKey2=0;	// 3-2011,3-2012 자판 오른쪽 기호 확장 글쇠 누른 횟수
var keydown_process=0;	// 오른쪽 숫자판을 눌렀을 때 다른 문자가 들어가는 것을 막기 위한 ohiKeydown 처리 상태 변수
var shift_click=0;		// 배열표에서 윗글쇠 누른 상태
var capslock_click=0;		// 배열표에서 Caps Lock을 누른 상태
var layout_table_view=0;	// 자판 배열표 보기
var browser='', browser_ver=0, nu=navigator.userAgent;
var dkey, ukey;
var K3_90_layout, K3_sun_layout, K3_91_layout;
var K3_2011_layout, K3_2011_extended_layout1,	K3_2011_extended_layout2, K3_2011_extended_layout3;
var K3_2012_layout, K3_2012_extended_layout1, K3_2012_extended_layout2, K3_2012_extended_layout3;
var K3_Sin3_2003_layout, K3_Sin3_2003_layout2;
var K3_Sin3_2012_layout, K3_Sin3_2012_layout2;
var K3_Sin3_extended_layout1, K3_Sin3_extended_layout2, K3_Sin3_extended_layout3;

function browser_detect() {
	if(nu.indexOf('MSIE') != -1) {
		browser = "MSIE";
		browser_ver = parseFloat(nu.substring(nu.indexOf("MSIE ")+5));
		if(!browser_ver) {
			var trident = navigator.userAgent.match(/Trident\/(\d.\d)/i);
			if(trident!=undefined && trident!=null) trident='0';
			if(trident[1]=='6.0'){
  			browser_ver = 10;
			} else if(trident[1]=='5.0') {
				browser_ver = 9;
			} else if(trident[1]=='4.0') {
				browser_ver = 8;
			} else {
				browser_ver = 7;
			}
		}
	}
	else if(nu.indexOf('Firefox') != -1) {
		browser = "Firefox";
		browser_ver = parseFloat(nu.substring(nu.indexOf('Firefox/')+8));
	}
}

function backspace(f) {
	if(document.selection && browser=='MSIE' && browser_ver<9) {
		var s=document.selection.createRange(), t=s.text;
		s.moveStart('character', -f.value.length);
		var pos = s.text.length;
		if(f.setSelectionRange) {
			f.setSelectionRange(pos-1,pos);
			f.text='';
		}
		else if(f.createTextRange) {
			var range = f.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos-1);
			range.select();
			range.text = '';			
		}
	}
	else {
		var bs_start = f.selectionStart;
	  var bs_end = f.selectionEnd;
		if(bs_start == bs_end) {
			f.value = f.value.substr(0,bs_start-1)+f.value.substr(bs_end);
			f.selectionStart=f.selectionEnd=bs_start-1;
		}
		else {
			f.value = f.value.substr(0,bs_start)+f.value.substr(bs_end);
			f.selectionStart=f.selectionEnd=bs_start;
		}
	}
}

function ohiDoubleJamo(a,c,d) {
	var i, a=Array( // Double Jamos
		Array(Array(1,7,18,21,24),1,7,18,21,24), // Cho
		Array(Array(39,44,49),Array(31,32,51),Array(35,36,51),51), // Jung
		Array(Array(1,4,9,18,21),Array(1,21),Array(24,30),Array(1,17,18,21,28,29,30),Array(0,21),21))[a]; // Jong
	for(i=a[0].length; c!=a[0][i-1]; i--) if(!i) return i;
	for(a=a[i], i=a.length||1; 1; i--) if(!i || d==a || d==a[i-1]) return i;
}

function ohiInsert(f,m,c) { // Insert
	if(!c && ohiQ=='0,0,0,0,0,0') return true;
	if(c.length!=6) ohiQ=Array(0,0,0,0,0,0);
	else {
		var m=m||'0,0,0,0,0,0', i=c[0]+c[1], j=c[2]+c[3], k=c[4]+c[5];
		c=i&&j?0xac00+(i-(i<3?1:i<5?2:i<10?4:i<20?11:12))*588+(j-31)*28+k-(k<8?0:k<19?1:k<25?2:3):0x3130+(i||j||k);
	}

	if(document.selection && browser=="MSIE" && browser_ver<10 ) { // IE ~9
		var s=document.selection.createRange(), t=s.text;
		if(t && document.selection.clear) document.selection.clear();
		s.text=(m=='0,0,0,0,0,0'||c&&t.length>1?'':t.substr(0,t.length))+String.fromCharCode(c);
		if(!c || !m || s.moveStart('character',-1)) s.select();
	}
	else if(f.selectionEnd+1) {
		if(m!='0,0,0,0,0,0' && f.selectionEnd-f.selectionStart==1) f.selectionStart++;
		var e=document.createEvent('KeyboardEvent');
		if(e.initKeyEvent && !(browser=="Firefox" && browser_ver>=12)) { // Gecko
			e.initKeyEvent('keypress',0,0,null,0,0,0,0,127,c);
			if(c && f.dispatchEvent(e) && m) f.selectionStart--;
		} else { // Firefox 12~, Chrome
			var scrollTop = f.scrollTop, scrollLeft = f.scrollLeft, selectionStart = f.selectionStart;
			var endText = f.value.substr(f.selectionEnd,f.value.length);
			f.value = f.value.substr(0,selectionStart)+String.fromCharCode(c);
			var scrollHeight = f.scrollHeight, scrollWidth = f.scrollWidth;
			f.value += endText;
			f.scrollTop = (scrollTop > scrollHeight-f.clientHeight) ? scrollTop : scrollHeight-f.clientHeight;
			f.scrollLeft = (scrollLeft > scrollWidth-f.clientWidth) ? scrollLeft : scrollWidth-f.clientWidth;
			f.setSelectionRange(m || c<32 ? selectionStart:selectionStart+1, selectionStart+1);
		}
	}
}

function ohiRoman(f,c,e) { // Roman keyboard layouts (Dvorak, Colemak)
	var cc;
	
	if(En_type=='qwerty' || !e) cc=c;
	else {
		if(c>64 && c<91 && !e.shiftKey) c+=32;
		if(c>96 && c<123 && e.shiftKey) c-=32;
	}

	if(En_type=='dvorak') {
		cc=Array(/*!*/33,/*"*/95,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/45,/*(*/40,
		/*)*/41,/***/42,/*+*/125,/*,*/119,/*-*/91,/*.*/118,/*/*/122,/*0*/48,
		/*1*/49,/*2*/50,/*3*/51,/*4*/52,/*5*/53,/*6*/54,/*7*/55,/*8*/56,
		/*9*/57,/*:*/83,/*;*/115,/*<*/87,/*=*/93,/*>*/86,/*?*/90,/*@*/64,
		/*A*/65,/*B*/88,/*C*/74,/*D*/69,/*E*/62,/*F*/85,/*G*/73,/*H*/68,
		/*I*/67,/*J*/72,/*K*/84,/*L*/78,/*M*/77,/*N*/66,/*O*/82,/*P*/76,
		/*Q*/34,/*R*/80,/*S*/79,/*T*/89,/*U*/71,/*V*/75,/*W*/60,/*X*/81,
		/*Y*/70,/*Z*/58,/*[*/47,/*\*/92,/*]*/61,/*^*/94,/*_*/123,/*`*/96,
		/*a*/97,/*b*/120,/*c*/106,/*d*/101,/*e*/46,/*f*/117,/*g*/105,/*h*/100,
		/*i*/99,/*j*/104,/*k*/116,/*l*/110,/*m*/109,/*n*/98,/*o*/114,/*p*/108,
		/*q*/39,/*r*/112,/*s*/111,/*t*/121,/*u*/103,/*v*/107,/*w*/44,/*x*/113,
		/*y*/102,/*z*/59,/*{*/63,/*|*/124,/*}*/43,/*~*/126)[c-33];
	}

	if(En_type=='colemak')
		cc=Array(/*!*/33,/*"*/34,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/39,/*(*/40,
		/*)*/41,/***/42,/*+*/43,/*,*/44,/*-*/45,/*.*/46,/*/*/47,/*0*/48,
		/*1*/49,/*2*/50,/*3*/51,/*4*/52,/*5*/53,/*6*/54,/*7*/55,/*8*/56,
		/*9*/57,/*:*/79,/*;*/111,/*<*/60,/*=*/61,/*>*/62,/*?*/63,/*@*/64,	
		/*A*/65,/*B*/66,/*C*/67,/*D*/83,/*E*/70,/*F*/84,/*G*/68,/*H*/72,
		/*I*/85,/*J*/78,/*K*/69,/*L*/73,/*M*/77,/*N*/75,/*O*/89,/*P*/58,
		/*Q*/81,/*R*/80,/*S*/82,/*T*/71,/*U*/76,/*V*/86,/*W*/87,/*X*/88,
		/*Y*/74,/*Z*/90,/*[*/91,/*\*/92,/*]*/93,/*^*/94,/*_*/95,/*`*/96,
		/*a*/97,/*b*/98,/*c*/99,/*d*/115,/*e*/102,/*f*/116,/*g*/100,/*h*/104,
		/*i*/117,/*j*/110,/*k*/101,/*l*/105,/*m*/109,/*n*/107,/*o*/121,/*p*/59,
		/*q*/113,/*r*/112,/*s*/114,/*t*/103,/*u*/108,/*v*/118,/*w*/119,/*x*/120,
		/*y*/106,/*z*/122,/*{*/123,/*|*/124,/*}*/125,/*~*/126)[c-33];
		
	ohiInsert(f,0,cc);
}

function ohiHangeul2(f,c) { // 2-Beolsik
	if(c<65 || (c-1)%32>25) {
		ohiInsert(f,0,c);
		return;
	}
	var cc;
	if(K2_type=='ksx5002')
	 	cc=Array(17,48,26,23,7,9,30,39,33,35,
 						31,51,49,44,32,36,18,1,4,
 						21,37,29,24,28,43,27)[c%32-1];
	else if(K2_type=='kps9256')
		cc=Array(/*a*/24,/*b*/48,/*c*/26,/*d*/23,/*e*/7,/*f*/4,/*g*/21,/*h*/39,
						/*i*/35,/*j*/31,/*k*/51,/*l*/49,/*m*/33,/*n*/43,/*o*/32,/*p*/36,
						/*q*/18,/*r*/9,/*s*/1,/*t*/30,/*u*/44,/*v*/29,/*w*/17,/*x*/28,
						/*y*/37,/*z*/27)[c%32-1];

	if(c>64 && c<91)	cc += cc==32||cc==36?2:cc==18||cc==7||cc==24||cc==1||cc==21?1:0;
						
	if(cc<31) { // Jaum
		if((!ohiQ[5] || !(ohiQ[0]=-1)) && ohiQ[2]) ohiQ[5]=ohiDoubleJamo(2,ohiQ[4],cc);
		if(!ohiQ[2] || ohiQ[0]<0 || ohiQ[0] && (!ohiQ[4] || !ohiQ[5]) && (ohiQ[4] || cc==8 || cc==19 || cc==25))
			ohiInsert(f,(ohiQ=ohiQ[1]||ohiQ[2]||!ohiDoubleJamo(0,ohiQ[0],cc)?ohiQ:0),ohiQ=Array(cc,ohiQ?0:1,0,0,0,0));
		else if(!ohiQ[0] && (ohiQ[0]=cc) || (ohiQ[4]=ohiQ[4]||cc)) {ohiInsert(f,0,ohiQ);}
		if(ohiQ[5]) ohiQ[5]=cc;
	}
	else { // Moum
		if((!ohiQ[3] || ohiQ[4] || !(ohiQ[2]=-1)) && !ohiQ[4]) ohiQ[3]=ohiDoubleJamo(1,ohiQ[2],cc);
		if((ohiQ[0] && ohiQ[2]>0 && ohiQ[4]) && (ohiQ[5] || !(ohiQ[5]=ohiQ[4]) || !(ohiQ[4]=0))) {
			ohiInsert(f,0,Array(ohiQ[0],ohiQ[1],ohiQ[2],ohiQ[3],ohiQ[4],0));
			ohiInsert(f,ohiQ,ohiQ=Array(ohiQ[5],0,cc,0,0,0));
		}
		else if((!ohiQ[0] || ohiQ[2]) && (!ohiQ[3] || ohiQ[4]) || ohiQ[2]<0) ohiInsert(f,ohiQ,ohiQ=Array(0,0,cc,0,0,0));
		else if(ohiQ[2]=ohiQ[2]||cc) ohiInsert(f,0,ohiQ);
	}
}

function esc_ext_layout() {
	ohiHangeul3_SignExtKey1=ohiHangeul3_SignExtKey2=0;
	if(KE=='K3' && (K3_type=='3-2012' || K3_type=='3-2011') || K3_type.substr(0,4)=='sin3') view_keyboard(K3_type);
}

function ohiHangeul3(f,c) { // 3-Beolsik
	var cc,cc2;

	if(K3_type=='3-90') cc=K3_90_layout[c-33];
	if(K3_type=='3-sun') cc=K3_sun_layout[c-33];
	if(K3_type=='3-91') cc=K3_91_layout[c-33];
	if(K3_type=='3-2011') cc=K3_2011_layout[c-33];
	if(K3_type=='3-2012') cc=K3_2012_layout[c-33];

	if(K3_type.substr(0,4)=='sin3') {	// 신세벌식 자판
		if(K3_type=='sin3-2003') {
			var Sin3_layout=K3_Sin3_2003_layout.slice(0);
			var Sin3_layout2=K3_Sin3_2003_layout2.slice(0);
		}
		else if(K3_type=='sin3-2012') {
			var Sin3_layout=K3_Sin3_2012_layout.slice(0);
			var Sin3_layout2=K3_Sin3_2012_layout2.slice(0);
		}

		cc=Sin3_layout[c-33];
		cc2=Sin3_layout[c-33-32];	// 윗글 자리
		
		if(ohiHangeul3_SignExtKey1) {	// 신세벌식 확장 기호를 넣을 때
			if(ohiHangeul3_SignExtKey1==1) Sin3_layout = K3_Sin3_extended_layout1;
			else if(ohiHangeul3_SignExtKey1==2) Sin3_layout = K3_Sin3_extended_layout2;
			else if(ohiHangeul3_SignExtKey1==3) Sin3_layout = K3_Sin3_extended_layout3;
			cc=Sin3_layout[c-33];
			backspace(f);
			ohiInsert(f,0,cc);
			esc_ext_layout();
			view_keyboard(K3_type);
			
			return;
		}
		else if(!ohiHangeul3_SignExtKey1 && ohiQ[0]==150-92-35 && (cc==128 || cc==151 || cc==145) && !ohiQ[2] && !ohiQ[4]) {	// 신세벌 확장 기호를 넣을 조건을 갖추었을 될 때
			if(cc==128) ohiHangeul3_SignExtKey1=1;
			else if(cc==151) ohiHangeul3_SignExtKey1=2;
			else if(cc==145) ohiHangeul3_SignExtKey1=3;
			view_keyboard('sin3-ext');
			return;
		}
		else if(ohiQ[0] && ohiQ[2] && !ohiQ[4] && Sin3_layout2[c-33]) {
			cc=Sin3_layout2[c-33];	// 윗글쇠를 함께 눌렀을 때 왼쪽 윗글 자리의 겹받침 넣기
		}
		else if( (cc==144 || cc==153 || cc==156) && ohiQ[0] && !ohiQ[2] ) {	// 첫소리가 들어갔을 때에 오른손 자리의 가운뎃소리(ㅗ, ㅜ, ㅢ) 넣기
			cc=cc2;
			diphthong=1;
		}
		else if( (c==79 || c==80) && (cc==79 || cc==74) && !ohiQ[2] ) {	// 첫소리가 들어가지 않았을 때에 오른손 윗글 자리의 가운뎃소리(ㅗ, ㅜ) 넣기
			diphthong=1;
		}
		else if( diphthong && cc<31 && (ohiQ[2]==74-35 || ohiQ[2]==79-35 || ohiQ[2]==84-35) && !ohiQ[3] && (cc2==71 || cc2==86 || cc2==66 || cc2==67 || cc2==70) ) {
			cc=cc2; // 겹홀소리에서 ㅗ, ㅜ, ㅡ 다음에 들어가는 가운뎃소리
			diphthong=0;
		}
		else if( cc<31 && (ohiQ[0] && !ohiQ[2] && !ohiQ[4]) && (cc2>65 && cc2<87 || cc2==0x318D) ) {
			cc=cc2; // 왼손 쪽 가운뎃소리 넣기
			diphthong=0;
		}
		else if( cc==154 && ohiQ[0] ) {
			cc=74;	// 오른손 쪽 ㅋ 자리에 들어간 ㅗ
			diphthong=1;
		}
		else if(ohiQ[0] && ohiQ[2] && ohiQ[4] && cc==ohiQ[4] && (cc2=Sin3_layout2[c-33-32])) { 	// 같은 글쇠 거듭 눌러 겹받침 넣기
			ohiQ[4]=0;
			cc=cc2;
		}
	}

	if((K3_type=='3-2011' || K3_type=='3-2012') && ohiHangeul3_SignExtKey2<2 && (cc==74 && c!=47) && (!ohiQ[0]&&!ohiQ[2] || ohiQ[2])) {	// 왼쪽 특수기호 확장 글쇠(ㅗ)가 눌린 횟수 더하기
		if(!ohiHangeul3_SignExtKey2) ++ohiHangeul3_SignExtKey1;
		else ohiHangeul3_SignExtKey1+=2;
		view_keyboard(K3_type+'ext');
	}
	else if((K3_type=='3-2011' || K3_type=='3-2012') && ohiHangeul3_SignExtKey1<2 && cc==85 && (!ohiQ[0]&&!ohiQ[2] || ohiQ[2])) {	// 오른쪽 특수기호 확장 글쇠(ㅢ)가 눌린 횟수 더하기
		if(!ohiHangeul3_SignExtKey1)	++ohiHangeul3_SignExtKey2;
		else ohiHangeul3_SignExtKey2+=2;
		view_keyboard(K3_type+'ext');
	}
	else if(K3_type=='3-2011' && (ohiHangeul3_SignExtKey1 || ohiHangeul3_SignExtKey2)) {	// 3-2011 특수기호 확장 배열
		if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==1) cc=K3_2011_extended_layout1[c-33];
		else if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==2) cc=K3_2011_extended_layout2[c-33];
		else if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==3) cc=K3_2011_extended_layout3[c-33];
		else cc=0;

		ohiInsert(f,0,cc);
		ohiHangeul3_SignExtKey1=ohiHangeul3_SignExtKey2=0;
		view_keyboard(K3_type);
	}
	else if(K3_type=='3-2012' && (ohiHangeul3_SignExtKey1 || ohiHangeul3_SignExtKey2)) {	// 3-2012 특수기호 확장 배열
		if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==1) cc=K3_2012_extended_layout1[c-33];
		else if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==2) cc=K3_2012_extended_layout2[c-33];
		else if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==3) cc=K3_2012_extended_layout3[c-33];
		else cc=0;

		ohiInsert(f,0,cc);
		ohiHangeul3_SignExtKey1=ohiHangeul3_SignExtKey2=0;
		view_keyboard(K3_type);
	}
	else {	// 기본(일반) 배열 한글 넣기
		if(cc>127 && cc<158 && cc!=147 && !(K3_type=='sin3' && ohiHangeul3_SignExtKey)) { // Cho
			ohiInsert(f,(ohiQ=ohiQ[1]||ohiQ[2]||!ohiDoubleJamo(0,ohiQ[0],cc-92-35)?ohiQ:0),ohiQ=Array(cc-92-35,ohiQ?0:1,0,0,0,0));
		}
		else if(cc>65 && cc<87) { // Jung
			if(!ohiQ[3] || !(ohiQ[2]=-1)) ohiQ[3]=ohiDoubleJamo(1,ohiQ[2],cc-35);
			if((!ohiQ[0] || ohiQ[2]) && (!ohiQ[3] || ohiQ[4]) || ohiQ[2]<0) ohiInsert(f,ohiQ,ohiQ=Array(0,0,cc-35,0,0,0));
			else if(ohiQ[2]=ohiQ[2]||cc-35) ohiInsert(f,0,ohiQ);
		}
		else if(cc<31) { // Jong
			if(!ohiQ[5] || !(ohiQ[4]=-1)) ohiQ[5]=ohiDoubleJamo(2,ohiQ[4],cc);
			if(!ohiQ[0] || !ohiQ[2] || ohiQ[4] && !ohiQ[5] || ohiQ[4]<0) ohiInsert(f,ohiQ,ohiQ=Array(0,0,0,0,cc,0));
			else if(ohiQ[4]=ohiQ[4]||cc) ohiInsert(f,0,ohiQ);
		}
		else ohiInsert(f,0,cc);
	}
}

function input_extended_layout(u,d,ext,e1,e2,e3) {
	var i;
	if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==1) for(i=0;i<94;++i) ext.push(String.fromCharCode(e1[i]));
	else if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==2) for(i=0;i<94;++i) ext.push(String.fromCharCode(e2[i]));
	else if(ohiHangeul3_SignExtKey1+ohiHangeul3_SignExtKey2==3) for(i=0;i<94;++i) ext.push(String.fromCharCode(e3[i]));

	u.push(
		Array(ext[93],ext[0],ext[31],ext[2],ext[3],ext[4],ext[61],ext[5],ext[9],ext[7],ext[8],ext[62],ext[10],''),
		Array('',ext[48],ext[54],ext[36],ext[49],ext[51],ext[56],ext[52],ext[40],ext[46],ext[47],ext[90],ext[92],ext[91]),
		Array('',ext[32],ext[50],ext[35],ext[37],ext[38],ext[39],ext[41],ext[42],ext[43],ext[25],ext[1],''),
		Array('',ext[57],ext[55],ext[34],ext[53],ext[33],ext[45],ext[44],ext[27],ext[29],ext[30],''));
	d.push(
		Array(ext[63],ext[16],ext[17],ext[18],ext[19],ext[20],ext[21],ext[22],ext[23],ext[24],ext[15],ext[12],ext[28],''),
		Array('',ext[80],ext[86],ext[68],ext[81],ext[83],ext[88],ext[84],ext[72],ext[78],ext[79],ext[58],ext[60],ext[59]),
		Array('',ext[64],ext[82],ext[67],ext[69],ext[70],ext[71],ext[73],ext[74],ext[75],ext[26],ext[6]),
		Array('',ext[89],ext[87],ext[66],ext[85],ext[65],ext[77],ext[76],ext[11],ext[13],ext[14]));
}

function view_keyboard(type) {
	shift_click=0;
	KE = ohi_KE_Status.substr(0,2);
	var rows = document.getElementById('keyboardLayout')
	if(!rows || !layout_table_view) return false;
	if(!type) {
		layout_table_view = 0;
		rows.innerHTML = '<div style="text-align:right"><span class="menu" onclick="layout_table_view=1;view_keyboard(1);inputText_focus()" onmouseover="this.className=\'over\'" onmouseout="this.className=\'menu\'">배열표 보이기</span></div>';
		return false;
	}
	rows.style.position = "relative";
	rows.innerHTML = '';

	if(type==1) {
		if(KE=='K2') type = K2_type;
		else if(KE=='K3') type = K3_type;
		else type = En_type;
	}

	var ue_qwerty= Array(
		Array('~','!','@','#','$','%','^','&amp;','*','(',')','_','+','Back'),
		Array('Tab','Q','W','E','R','T','Y','U','I','O','P','{','}','|'),
		Array('Caps','A','S','D','F','G','H','J','K','L',':','"','Enter'),
		Array('Shift','Z','X','C','V','B','N','M','&lt;','&gt;','?','Shift'));
	var de_qwerty= Array(
		Array('` ','1 ','2 ','3 ','4 ','5 ','6 ','7 ','8 ','9 ','0 ','- ','= ','Space'),
		Array('','　','　','　','　','　','　','　','　','　','　','[ ','] ','\\ '),
		Array('Lock','　','　','　','　','　','　','　','　','　','; ','\' '),
		Array('','　','　','　','　','　','　','　',', ','. ','/ '));

	var ue_dvorak= Array(
		Array('~','!','@','#','$','%','^','&amp;','*','(',')','{','}','Back'),
		Array('Tab','"','&lt;','&gt;','P','Y','F','G','C','R','L','?','+','|'),
		Array('Caps','A','O','E','U','I','D','H','T','N','S','_','Enter'),
		Array('Shift',': ','Q','J','K','X','B','M','W','V','Z','Shift'));
	var de_dvorak= Array(
		Array('` ','1 ','2 ','3 ','4 ','5 ','6 ','7 ','8 ','9 ','0 ','[ ','] ','Space'),
		Array('','\' ',', ','. ','　','　','　','　','　','　','　','/ ','= ','\\ '),
		Array('Lock','　','　','　','　','　','　','　','　','　','　','- '),
		Array('','; ','　','　','　','　','　','　','　','　','　'));
		
	var ue_colemak= Array(
		Array('~','!','@','#','$','%','^','&amp;','*','(',')','_','+','Back'),
		Array('Tab','Q','W','F','P','G','J','L','U','Y',':','{','}','|'),
		Array('Caps','A','R','S','T','D','H','N','E','I','O','"','Enter'),
		Array('Shift','Z','X','C','V','B','K','M','&lt;','&gt;','?','Shift'));
	var de_colemak= Array(
		Array('` ','1 ','2 ','3 ','4 ','5 ','6 ','7 ','8 ','9 ','0 ','- ','= ','Space'),
		Array('','　','　','　','　','　','　','　','　','　','; ','[ ','] ','\\ '),
		Array('Lock','　','　','　','　','　','　','　','　','　','　','\' '),
		Array('','　','　','　','　','　','　','　',', ','. ','/ '));

	var u2_KSX5002 = Array(
		Array(),
		Array('','ㅃ','ㅉ','ㄸ','ㄲ','ㅆ','　','　','　','ㅒ','ㅖ'));
	var d2_KSX5002 = Array(
		Array(),
		Array('','ㅂ','ㅈ','ㄷ','ㄱ','ㅅ','ㅛ','ㅕ','ㅑ','ㅐ','ㅔ'),
		Array('','ㅁ','ㄴ','ㅇ','ㄹ','ㅎ','ㅗ','ㅓ','ㅏ','ㅣ'),
		Array('','ㅋ','ㅌ','ㅊ','ㅍ','ㅠ','ㅜ','ㅡ'));

	var u2_KPS9256 = Array(
		Array(),
		Array('','ㅃ','','ㄸ','','','','','','ㅒ','ㅖ'),
		Array('','ㅉ','ㄲ','','','ㅆ','','','',''));
	var d2_KPS9256 = Array(
		Array(),
		Array('','ㅂ','ㅁ','ㄷ','ㄹ','ㅎ','ㅕ','ㅜ','ㅓ','ㅐ','ㅔ'),
		Array('','ㅈ','ㄱ','ㅇ','ㄴ','ㅅ','ㅗ','ㅏ','ㅣ','ㅡ'),
		Array('','ㅋ','ㅌ','ㅊ','ㅍ','ㅠ','ㅛ','ㅑ'));

	var u3_90= Array(
		Array('','ㅈ','','','','','','','','','','',''),
		Array('','ㅍ','ㅌ','ㅋ','ㅒ',';&nbsp;','<','７','８','９','>','','',''),
		Array('','ㄷ','ㄶ','ㄺ','ㄲ','/&nbsp;','\'&nbsp;','４','５','６','',''),
		Array('','ㅊ','ㅄ','ㄻ','ㅀ','！','０','１','２','３',''));
	var d3_90= Array(
		Array('','ㅎ','ㅆ','ㅂ','ㅛ','ㅠ','ㅑ','ㅖ','ㅢ','ㅜ','ㅋ','',''),
		Array('','ㅅ','ㄹ','ㅕ','ㅐ','ㅓ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','','',''),
		Array('','ㅇ','ㄴ','ㅣ','ㅏ','ㅡ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅔ','ㅗ','ㅜ','ㅅ','ㅎ','','','ㅗ'));

	var u3_sun= Array(
		Array(),
		Array('','ㅅ','ㄹ','ㅕ','ㅐ',';&nbsp;','<','７','８','９','>','','',''),
		Array('','ㅇ','[&nbsp;',']&nbsp;','ㅏ','/&nbsp;','\'&nbsp;','４','５','６','',''),
		Array('','-&nbsp;','=&nbsp;','\\&nbsp;','ㅗ','！','０','１','２','３',''));
	var d3_sun= Array(
		Array('','ㅎ','ㅆ','ㅂ','ㅛ','ㅠ','ㅑ','ㅖ','ㅢ','ㅋ','ㅒ','ㅈ','ㅊ'),
		Array('','ㅅ','ㄹ','ㅕ','ㅐ','ㅓ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','ㅌ','ㅍ','ㅋ'),
		Array('','ㅇ','ㄴ','ㅣ','ㅏ','ㅡ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅔ','ㅗ','ㅜ','ㅅ','ㅎ','','','ㄷ'));

	var u3_91= Array(
		Array('※','ㄲ','ㄺ','ㅈ','ㄿ','ㄾ','＝','“','”','\'','～',';&nbsp;',''),
		Array('','ㅍ','ㅌ','ㄵ','ㅀ','ㄽ','５','６','７','８','９','％','/','＼'),
		Array('','ㄷ','ㄶ','ㄼ','ㄻ','ㅒ','０','１','２','３','４','·&nbsp;'),
		Array('','ㅊ','ㅄ','ㅋ','ㄳ','？','-','"',',&nbsp;','.&nbsp;','！'));
	var d3_91= Array(
		Array('*&nbsp;','ㅎ','ㅆ','ㅂ','ㅛ','ㅠ','ㅑ','ㅖ','ㅢ','ㅜ','ㅋ',')&nbsp;','&gt;'),
		Array('','ㅅ','ㄹ','ㅕ','ㅐ','ㅓ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','(&nbsp;','&lt;',':&nbsp;'),
		Array('','ㅇ','ㄴ','ㅣ','ㅏ','ㅡ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅔ','ㅗ','ㅜ','ㅅ','ㅎ','','','ㅗ'));

	var u3_2011= Array(
		Array('_&nbsp;','ㄲ','ㄺ','ㄵ','','#','','','～','','','*&nbsp;',''),
		Array('','ㅍ','ㅌ','ㅈ','ㅀ','ㅒ','５','６','７','８','９','-&nbsp;','/&nbsp;','＼'),
		Array('','ㄷ','ㄶ','ㄼ','ㄻ','!&nbsp;','０','１','２','３','４','％'),
		Array('','ㅊ','ㅄ','ㅋ','ㄳ','@','\'&nbsp;','"&nbsp;','','',''));
	var d3_2011= Array(
		Array(';&nbsp;','ㅎ','ㅆ','ㅂ','ㅛ','ㅠ','ㅑ','ㅖ','ㅢ','ㅜ','ㅋ','[&nbsp;',']&nbsp;'),
		Array('','ㅅ','ㄹ','ㅕ','ㅓ','ㅐ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','·&nbsp;',':&nbsp;','='),
		Array('','ㅇ','ㄴ','ㅣ','ㅏ','ㅡ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅔ','ㅗ','ㅜ','ㅅ','ㅎ','','','ㅗ'));
	var u3_2011ext= Array(
		Array('®','™','℉','℃','￥','￡','✂','『','』','「','」','〔','〕'),
		Array('','↓','↑','↔','•&nbsp;','✓','⑤','⑥','⑦','⑧','⑨','±','÷','≒'),
		Array('','◈','▣','◉','△','▽','⑩','①','②','③','④','‰'),
		Array('','♡','☆','☎','▷','◁','《','》','〈','〉','※'));
	var d3_2011ext= Array(
		Array('©','μ','²','³','₩','€','㉾','§',' ',' ','㉪','【','】'),
		Array('','←','→','×','`&nbsp;','〃','㉣','㉢','㉤','㉩','㉬','&nbsp;{','&nbsp;}','≠'),
		Array('','◇','□','○','―','|&nbsp;','㉡','㉧','㉠','㉨','㉥','㉫'),
		Array('','″&nbsp;','′&nbsp;','°&nbsp;',' ','ː&nbsp;','㉦','㉭','、','。','…'));

	var u3_2012= Array(
		Array(),
		Array('','ㅍ','ㅌ','ㅈ','ㅀ','ㅒ','５','６','７','８','９','','',''),
		Array('','ㄷ','ㄶ','ㄺ','ㄻ',':&nbsp;','０','１','２','３','４','/&nbsp;'),
		Array('','ㅊ','ㅄ','ㅋ','ㄲ',';&nbsp;','\'&nbsp;','"&nbsp;','','',''),
		Array(''));
	var d3_2012= Array(
		Array('','ㅎ','ㅆ','ㅂ','ㅛ','ㅠ','ㅑ','ㅖ','ㅢ','ㅜ','ㅋ','',''),
		Array('','ㅅ','ㄹ','ㅕ','ㅓ','ㅐ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','','',''),
		Array('','ㅇ','ㄴ','ㅣ','ㅏ','ㅡ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅔ','ㅗ','ㅜ','ㅅ','ㅎ','','','ㅗ'),
		Array(''));
	var u3_2012ext= Array(
		Array('®','™','℉','℃','￥','￡','✂','『','』','「','」','♂','♀'),
		Array('','↓','↑','↔','•&nbsp;','✓','⑤','⑥','⑦','⑧','⑨','〔','〕','¶'),
		Array('','◈','▣','◉','△','▽','⑩','①','②','③','④','÷'),
		Array('','♡','☆','☎','▷','◁','《','》','〈','〉','※'));
	var d3_2012ext= Array(
		Array('©','μ','²','³','₩','€','㉾','§','&nbsp;','&nbsp;','㉪','±','≠'),
		Array('','←','→','×','´&nbsp;','〃','㉣','㉢','㉤','㉩','㉬','【','】','≒'),
		Array('','◇','□','○','·&nbsp;','―','㉡','㉧','㉠','㉨','㉥','㉫'),
		Array('','″&nbsp;','′&nbsp;','°&nbsp;','&nbsp;','ː&nbsp;','㉦','㉭','、','。','…'));

	var u3_Sin2003= Array(
		Array(),
		Array('','ㅒ','ㅑ','ㅕ','ㅐ','ㅓ','“&nbsp;','”&nbsp;','ㅢ','ㅜ','ㅗ','','',''),
		Array('','ㅠ','ㅖ','ㅣ','ㅏ','ㅡ','‘&nbsp;','’&nbsp;',';&nbsp;','\'&nbsp;','',''),
		Array('','※','ㅛ','ㅔ','ㅗ','ㅜ','·&nbsp;','/&nbsp;','','','<font size="0.9em">(ㅗ)</font>'));
	var d3_Sin2003= Array(
		Array(),
		Array('','ㅅ','ㄹ','ㅂ','ㅌ','ㅍ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','','',''),
		Array('','ㅇ','ㄴ','ㄷ','ㅆ','ㅈ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅊ','ㅎ','ㅋ','ㅅ','ㅎ','','','ㅋ'));

	var u3_Sin2012= Array(
		Array(),
		Array('','ㅒ','ㅑ','ㅕ','ㅓ','ㅐ','×','○','ㅢ','ㅜ','ㅗ','','',''),
		Array('','ㅠ','ㅖ','ㅣ','ㅏ','ㅡ','□','―','·&nbsp;',';&nbsp;','','/&nbsp;'),
		Array('','ㆍ','ㅛ','ㅔ','ㅗ','ㅜ','\'&nbsp;','"&nbsp;','','','<font size="0.9em">(ㅗ)</font>'));
	var d3_Sin2012= Array(
		Array(),
		Array('','ㅅ','ㄹ','ㅂ','ㅌ','ㄷ','ㄹ','ㄷ','ㅁ','ㅊ','ㅍ','','',''),
		Array('','ㅇ','ㄴ','ㅆ','ㅊ','ㅈ','ㄴ','ㅇ','ㄱ','ㅈ','ㅂ','ㅌ'),
		Array('','ㅁ','ㄱ','ㅋ','ㅎ','ㅍ','ㅅ','ㅎ','','','ㅋ'));
	
	var ext = Array();
	if(K3_type.substr(0,4)=='sin3' && ohiHangeul3_SignExtKey1) {
		var u3_Sin_ext=Array(), d3_Sin_ext=Array();
		input_extended_layout(u3_Sin_ext, d3_Sin_ext, ext, K3_Sin3_extended_layout1, K3_Sin3_extended_layout2, K3_Sin3_extended_layout3);
	}

	if(KE=='En') {
		var uh = Array();
		var dh = Array();
	}
	else {
		uh = type=='ksx5002' ? u2_KSX5002 : type=='kps9256' ? u2_KPS9256 : type=='3-2012' ? u3_2012 : type=="3-2012ext" ? u3_2012ext : type=='3-2011' ? u3_2011 : type=='3-2011ext' ? u3_2011ext : type=='3-91' ? u3_91 : type=='3-90' ? u3_90 : type=='3-sun' ? u3_sun : type=='sin3-2003' ? u3_Sin2003 : type=='sin3-2012' ? u3_Sin2012 : type=='sin3-ext' ? u3_Sin_ext : NULL;
		dh = type=='ksx5002' ? d2_KSX5002 : type=='kps9256' ? d2_KPS9256 : type=='3-2012' ? d3_2012 : type=="3-2012ext" ? d3_2012ext : type=='3-2011' ? d3_2011 : type=='3-2011ext' ? d3_2011ext : type=='3-91' ? d3_91 : type=='3-90' ? d3_90 : type=='3-sun' ? d3_sun : type=='sin3-2003' ? d3_Sin2003 : type=='sin3-2012' ? d3_Sin2012 : type=='sin3-ext' ? d3_Sin_ext : NULL;
	}

	var ue = En_type=='qwerty' ? ue_qwerty : En_type=='dvorak' ? ue_dvorak : En_type=='colemak' ? ue_colemak : NULL;
	var de = En_type=='qwerty' ? de_qwerty : En_type=='dvorak' ? de_dvorak : En_type=='colemak' ? de_colemak : NULL;
	if(type.substr(0,4)=='sin3' && KE=='K3' && !ohiHangeul3_SignExtKey1) {
		var de= Array(
			de[0],
			Array(de[1][0],'ㄽ','ㄺ','ㄼ','ㄾ',type.substr(5,4)=='2003' ? 'ㄿ' : '　',de[1][6],de[1][7],de[1][8],de[1][9],de[1][10],de[1][11],de[1][12],de[1][13]),
			Array(de[2][0],'ㅄ','ㄶ','ㄵ','　','　',de[2][6],de[2][7],de[2][8],de[2][9],de[2][10],de[2][11],de[2][12]),
			Array(de[3][0],'ㄻ','ㄲ','ㄳ','ㅀ',type.substr(5,4)=='2012' ? 'ㄿ' : '　',de[3][6],de[3][7],de[3][8],de[3][9],de[3][10],de[3][11]));
	}
	ue.push(Array('영문','2벌식','3벌식','Space','2벌식','3벌식','기준'));
	de.push(Array('바꿈','바꿈','바꿈','','한/영','한/영','자판'));

	rows.innerHTML += '<div id="keyboardLayoutInfo" style="float:left;margin-left:5px;"></div><div style="text-align:right"><span class="menu" onclick="view_keyboard(0);inputText_focus()" onmouseover="this.className=\'over\'" onmouseout="this.className=\'menu\'">배열표 숨기기</span></div>';
	rows.innerHTML += '<table style="border-collapse:collapse;">';
	rows.innerHTML += '<tr><td><table><tr id="row0"></tr></table></td></tr>';
	rows.innerHTML += '<tr><td><table><tr id="row1"></tr></table></td></tr>';
	rows.innerHTML += '<tr><td><table><tr id="row2"></tr></table></td></tr>';
	rows.innerHTML += '<tr><td><table><tr id="row3"></tr></table></td></tr>';
	rows.innerHTML += '<tr><td><table style="margin:0 0px 0 0px"><tr id="row4"></tr></table></td></tr>';
	rows.innerHTML += '</table>';

	for(i=0, k=-1; ue[i]; i++) {
		var row = document.getElementById('row'+i);
		for(j=0; ue[i][j]; j++) {
			var tdclass = 'e1';
			var tdid = 'key'+(++k);
			var charcode;
			if(dh[i] && dh[i][j]) {
				charcode = dh[i][j].charCodeAt(0);
				if(charcode>0x3130) tdclass = (type.substr(0,1)=='2' || j>5 && !(i<2&&j>10 || i==3&&j==10&&type.substr(0,4)!='sin3')) ? 'h1':'h3';
				if(charcode>0x314E) tdclass = 'h2';				
			}
			if(KE=='En' && ue[i][j].length==1) {
				charcode = ue[i][j].charCodeAt(0);		
				if(charcode>64 && charcode<91 || charcode>96 && charcode<123) tdclass = 'e2';
			}
			var col = appendChild(row,'td',tdclass,tdid,'','30px','1px 3px 1px 3px');
			col.onclick = function(){clickTableKey(this.id.substr(3), dkey[this.id.substr(3)],ukey[this.id.substr(3)]);};

			if(ue[i][j]=='Back' || ue[i][j]=='Tab') col.style.width = '54px';
			if(ue[i][j]=='Caps' || ue[i][j]=='Enter') col.style.width = '64px';
			if(ue[i][j]=='Shift') col.style.width = '84px';
			if(ue[i][j]=='Back' || ue[i][j]=='Tab' || ue[i][j]=='Caps' || ue[i][j]=='Enter' || ue[i][j]=='Shift')
				col.style.padding = '1px', col.style.textAlign = 'center';
			
			if(i==4) {
				if(ue[i][j]=='Space') col.style.width = '300px';
				else col.style.width = '35px', col.style.fontSize = '12px', col.className = 'e3';
			}
			appendChild(col,'span','e1','',ue[i][j]);
			if(uh[i] && uh[i][j]) appendChild(col,'span','','ue'+k,uh[i][j]);
			if(de[i][j]) {
				appendChild(col,'br');
				appendChild(col,'span','e1','de'+k,de[i][j]=='　' ? '&nbsp;' : de[i][j]);
				if(dh[i] && dh[i][j]) appendChild(col,'span','','',dh[i][j]);
			}
		}
	}

	if(KE=='K3' && (K3_type=='3-2011' || K3_type=='3-2012') ) {
		document.getElementById('de8').innerHTML = '<span style="margin-left:-1px;background:black;color:#fff;letter-spacing:-1px;font-size:8px;">기호</span>';
		document.getElementById('de45').innerHTML = '<span style="margin-left:-1px;background:black;color:#fff;letter-spacing:-1px;font-size:8px;">기호</span>';
	}
	
	if(KE=='K3' && K3_type.substr(0,4)=='sin3') {
		document.getElementById('de35').innerHTML = '<span style="margin-left:-1px;background:black;color:#fff;letter-spacing:-1px;font-size:8px;">기호</span>';
		for(i=0;i<3;++i)
			document.getElementById('de'+(36+i)).innerHTML = '<span style="padding:0 2px;background:black;color:#fff;">'+String.fromCharCode(0x2460+i)+'</span>';
	}

	if(capslock_click) {
		var capslock = document.getElementById('key28');
		capslock.style.backgroundColor = 'orange';
	}
	viewStateBar();
}

function ohiStart(l) {
	var KBD=ohi_KE_Status.substr(2,7); // QWERTZ, QWERTZ, AZERTY 자판 종류
	var KE=ohi_KE_Status.substr(0,2); // 한·영 상태
	if(l!=undefined && l!=null && l.length==9) {
		if(l.substr(2,7)==':QWERTY') KBD='';
		else if(l.substr(2,7)==':QWERTZ' || l.substr(2,7)==':AZERTY') KBD=l.substr(2,7);
	}
	
	if(typeof(l)=='string') {
		if(l=='KBD') ohi_KE_Status = KE+ (!KBD ? ':QWERTZ' : KBD==':QWERTZ' ? ':AZERTY' : '');
		else ohi_KE_Status = l.substr(0,2)+KBD;
	}

	var En_type_name=En_type, K2_type_name=K2_type, K3_type_name=K3_type;

	if(En_type=='dvorak') En_type_name='Dvorak';
	else if(En_type=='qwerty') En_type_name='QWERTY';
	else if(En_type=='colemak') En_type_name='Colemak';

	if(K2_type=='ksx5002') K2_type_name='KSX5002';
	else if(K2_type=='kps9256') K2_type_name='KPS9256';

	if(K3_type=='sin3-2003') K3_type_name='Sin3-2003';
	else if(K3_type=='sin3-2012') K3_type_name='Sin3-2012';
	
	ohiStatus.innerHTML = ohi_KE_Status + ' (En:' + En_type_name + ' / K2:' + K2_type_name + ' / K3:'+ K3_type_name + ')';

	if(document.body) {
		if(document.all) {
			ohiStatus.style.position = 'absolute';
			ohiStatus.style.right = -(document.body.scrollLeft||document.documentElement.scrollLeft)+'px';
			ohiStatus.style.bottom = -(document.body.scrollTop||document.documentElement.scrollTop)+'px';
			if(ohiTimeout) clearTimeout(ohiTimeout);
			ohiTimeout = setTimeout("ohiStart()",100);
		}
		if(document.body!=ohiStatus.parentNode) {
			if(!ohiStatus.style.position) {
				ohiStatus.style.position = 'fixed';
				ohiStatus.style.right = '0px';
				ohiStatus.style.bottom = '0px';
			}
			ohiStatus.target = '_blank';
			ohiStatus.href = 'http://ohi.pat.im';
			ohiStatus.style.fontFamily = 'GulimChe,monospace';
			ohiStatus.style.fontWeight = 'normal';
			ohiStatus.style.color = 'white';
			ohiStatus.style.backgroundColor = 'royalblue';
			ohiStatus.style.fontSize = '10pt';
			ohiStatus.style.lineHeight = '10pt';
			ohiStatus.style.zIndex = '255';

			document.body.appendChild(ohiStatus);
			if(document.addEventListener) {
				document.addEventListener('keypress', ohiKeypress, true);
				document.addEventListener('keydown', ohiKeydown, true);
			} else {
				document.onkeydown = ohiKeydown;
				document.onkeypress = ohiKeypress;
			}
			for(var i=0; i<window.frames.length; i++) {
				var ohi = document.createElement('script');
				ohi.type= 'text/javascript';
				ohi.src = 'http://ohi.pat.im/ohi.js';
				if(typeof(window.frames[i].document)!='unknown') window.frames[i].document.body.appendChild(ohi);
			}
		}
	}
	else ohiTimeout = setTimeout("ohiStart()",100);
}

function viewStateBar() {
	var KBD=ohi_KE_Status.substr(2,7);
	var KE=ohi_KE_Status.substr(0,2);

	var name='', keyboardLayoutInfo = document.getElementById('keyboardLayoutInfo');
	if(keyboardLayoutInfo) {
		if(KE=='En') {
			name = '<strong>[영문' + KBD + ']</strong> ';
			if(En_type=='qwerty') name += '쿼티('+En_type+')';
			else if(En_type=='dvorak') name += '드보락('+En_type+')';
			else if(En_type=='colemak') name += '콜맥('+En_type+')';
		}
		else if(KE=='K2') {
			name = '<strong>[한글 2벌식' + KBD +  ']</strong> ';
			if(K2_type=='ksx5002') name += '한국 표준 KS X 5002';
			else if(K2_type=='kps9256') name += '조선 국규 9256';
		}
		else if(KE=='K3') {
			name = '<strong>[한글 3벌식' + KBD + ']</strong> ';
			if(K3_type=='3-sun') name += '순아래';
			else if(K3_type=='sin3-2003') name += '신세벌식 2003 (박경남 수정 신세벌식)';
			else if(K3_type=='sin3-2012') name += '신세벌식 2012';
			else name += K3_type;
				
			if(K3_type=='3-2012' || K3_type=='3-90') name += ' (사무용)';
			else if(K3_type=='3-2011' || K3_type=='3-91') name += ' (문장용)';
		}
		keyboardLayoutInfo.innerHTML = name;
	}
}

function ohiChange_KE(Ko) {	// 한·영 상태 바꾸기
	var KE = ohi_KE_Status.substr(0,2);
	var KBD = ohi_KE_Status.substr(3);
	if(KE=='En') ohiStart((Ko=='K2' ? 'K2' : 'K3')+(KBD ? ':'+KBD : ''));
	else if(KE!=Ko) ohiStart(Ko+(KBD ? ':'+KBD : ''));
	else ohiStart('En'+(KBD ? ':'+KBD : ''));
	
	KE = ohi_KE_Status.substr(0,2);
	if(KE=='En') view_keyboard(En_type);
	else if(KE=='K2') view_keyboard(K2_type);
	else if(KE=='K3') view_keyboard(K3_type);
}

function ohiChange_KBD(KBD) {	// 기준 자판 바꾸기
	if(KBD==undefined || KBD==null) ohiStart('KBD');
	else {
		KBD = KBD.toUpperCase();
		if(KBD=='QWERTY' || KBD=='QWERTZ' || KBD=='AZERTY') ohiStart(ohi_KE_Status.substr(0,2)+':'+KBD);
	}
	view_keyboard(layout_table_view);
}
		
function ohiChange_eng() {	// 영문 배열 종류 바꾸기 (QWERTY/Dvorak/Colemak)
	ohi_KE_Status = ohi_KE_Status.replace(/(K2|K3)/,'En');
	En_type = En_type=='qwerty' ? 'dvorak' : En_type=='dvorak' ? 'colemak' : 'qwerty';
	view_keyboard(En_type);
	ohiStart();
}
function ohiChange_K2() {	// 두벌식 배열 종류 바꾸기 (한국/조선 표준 자판)
	ohi_KE_Status = ohi_KE_Status.replace(/(En|K3)/,'K2');
	K2_type = K2_type=='ksx5002' ? 'kps9256' : 'ksx5002';
	view_keyboard(K2_type);
	ohiStart();
}
function ohiChange_K3() {	// 세벌식 배열 종류 바꾸기 (3-2011/3-91/3-90)
	ohi_KE_Status = ohi_KE_Status.replace(/(En|K2)/,'K3');
	K3_type = K3_type=='3-2012' ? '3-2011' : K3_type=='3-2011' ? '3-91' : K3_type=='3-91' ? '3-90' : K3_type=='3-90' ? '3-sun' : K3_type=='3-sun' ? 'sin3-2003' : K3_type=='sin3-2003' ? 'sin3-2012' : '3-2012';
	view_keyboard(K3_type);
	ohiStart();
}

function ohiKeypress(e) {
	if(keydown_process) return false;
	var key_pressed=0;
	var e=e||window.event, f=e.target||e.srcElement, n=f.nodeName||f.tagName, c=e.which||e.which==0?e.which:e.keyCode;
	var i=0, swaped=Array();
	var KBD=ohi_KE_Status.substr(3);
	var KE=ohi_KE_Status.substr(0,2);
	if(KBD=='QWERTZ') swaped=Array(89,90,90,89,121,122,122,121);
	if(KBD=='AZERTY') swaped=Array(65,81,81,65,87,90,90,87,97,113,113,97,119,122,122,119,77,58,109,59,44,109,58,46,59,44);
	if(f.type=='text' && n=='INPUT' || n=='TEXTAREA') {
		if(browser=="MSIE" && browser_ver<9 && (c==10 || c==13 || c==32) && !e.ctrlKey && !e.shiftKey && !e.altKey) ohiInsert(f,0,c);
		else if((c==10 || c==13 || c==32) && ohiInsert(f,0,0) && (e.ctrlKey&&!e.shiftKey || !e.ctrlKey&&e.shiftKey)) { // Toggle
			if((c==10 || c==13) && e.ctrlKey) ohiChange_KBD(); // 기준 자판 바꾸기
			else if(c==32 && e.ctrlKey) ohiChange_KE('K2');	// 2벌식 자판 한·영 바꾸기
			else if(c==32 && e.shiftKey) ohiChange_KE('K3');	// 3벌식 배열 한·영 바꾸기
			if(e.preventDefault) e.preventDefault();
			key_pressed=0;
		}
		else if(c==49 && e.altKey && !e.ctrlKey && !e.shiftKey) {	// 영문 배열 종류 바꾸기 (QWERTY/Dvorak/Colemak)
			ohiChange_eng();
			if(e.preventDefault) e.preventDefault();
			key_pressed=0;
		}
		else if(c==50 && e.altKey && !e.ctrlKey && !e.shiftKey) {	// 두벌식 배열 종류 바꾸기 (한국/조선 표준 자판)
			ohiChange_K2();
			if(e.preventDefault) e.preventDefault();
			key_pressed=0;
		}
		else if(c==51 && e.altKey && !e.ctrlKey && !e.shiftKey) {	// 세벌식 배열 종류 바꾸기 (3-2011/3-91/3-90)
			ohiChange_K3();
			if(e.preventDefault) e.preventDefault();
			key_pressed=0;
		}
		else if(ohi_KE_Status.substr(0,2)=='En' && c>32 && c<127 && e.keyCode<127 && !e.altKey && !e.ctrlKey) {
			ohiRoman(f,c,e);
			if(e.preventDefault) e.preventDefault();
			key_pressed=1;
		}
		else if(ohi_KE_Status.substr(0,2)!='En' && c>32 && c<127 && e.keyCode<127 && !e.altKey && !e.ctrlKey) {
			if(c>64 && c<91 && !e.shiftKey) c+=32;
			if(c>96 && c<123 && e.shiftKey) c-=32;
			if(document.selection && document.selection.createRange().text.length!=1) ohiQ=Array(0,0,0,0,0,0);
			if(f.selectionEnd+1 && f.selectionEnd-f.selectionStart!=1) ohiQ=Array(0,0,0,0,0,0);
			while (swaped[i] && swaped[i]!=c) i+=2;
			if(i!=swaped.length) c=swaped[i+1];
			if(ohi_KE_Status.substr(0,2)=='K2') ohiHangeul2(f,c);
			if(ohi_KE_Status.substr(0,2)=='K3') ohiHangeul3(f,c);

			if(e.preventDefault) e.preventDefault();
			key_pressed=1;
		}
	}

	if(key_pressed && layout_table_view) {
		var shift1 = document.getElementById('key41');
		var shift2 = document.getElementById('key52');
		shift1.className = shift1.className.substr(0,2);
		shift2.className = shift2.className.substr(0,2);
	
		for(var j=0;j<dkey.length;++j) {
			if(j==41 || j==52) continue;
			var key_td =document.getElementById('key'+j);
			key_td.className = key_td.className.substr(0,2);
			if(c==dkey[j] || c==ukey[j]) key_td.className = key_td.className + ' pressed';
			if(c==ukey[j] && c!=dkey[j]) {
				shift1.className = shift1.className + ' pressed';
				shift2.className = shift2.className + ' pressed';
			}
		}
	}

	return false;
}

function ohiKeydown(e) {
	keydown_process=0;
	var e=e||window.event, f=e.target||e.srcElement, n=f.nodeName||f.tagName, c=e.which||e.which==0?e.which:e.keyCode;
	if(f.type=='text' && n=='INPUT' || n=='TEXTAREA') {
		if(layout_table_view) {
			var shift1 = document.getElementById('key41');
			var shift2 = document.getElementById('key52');

			shift1.className = shift1.className.substr(0,2);
			shift2.className = shift2.className.substr(0,2);
			var key_td;

			for(var j=0;j<dkey.length;++j) {
				if(j==41 || j==52) continue;	// 두 윗글쇠(shift)는 건너뜀
				key_td =document.getElementById('key'+j);
				key_td.className = key_td.className.substr(0,2);
				if(e.keyCode==dkey[j]) {
					if(e.keyCode==39 && c==39) continue; // 오른쪽 화살표 글쇠 건너뜀
					if(e.keyCode==45 || e.keyCode==46) continue; // insert(45), del(46) 건너뜀
					if(e.keyCode==91 || e.keyCode==93) continue; // menu 건너뜀
					if(e.keyCode>=112 && e.keyCode<=123) continue; // F1~F12 건너뜀
					key_td.className = key_td.className + ' pressed';
				}					
			}
		}
		if(e.keyCode==8 && (ohiQ[1] || ohiQ[3] || ohiQ[0] && ohiQ[2])) { // Backspace (한글 조합 상태)
			for(var i=5; !ohiQ[i];) i--;
			ohiInsert(f,ohiQ[i]=0,ohiQ);
			if(e.preventDefault) e.preventDefault();
			esc_ext_layout();
			return false;
		}
		if(e.keyCode==8 && ohiQ[0]) { // Backspace
			ohiQ[0]=0;
			esc_ext_layout();
		}
		if(e.keyCode!=16 && e.keyCode<47) {
			esc_ext_layout();
			ohiInsert(f,0,0);
		}
	}
}

function inputText_focus() {
	var target_element = document.getElementById('inputText');
	if(target_element) target_element.focus();
}

function menu_toggle(KE, kbd) {
	inputText_focus();
	ohi_KE_Status = ohi_KE_Status.replace(/(En|K2|K3)/,KE.substr(0,2));
			
	if(KE=='En') {
		if(!kbd) ohiChange_eng();
		else En_type=kbd;
		if(layout_table_view) view_keyboard(En_type);
	}
	else if(KE=='K2') {
		if(!kbd) ohiChange_K2();
		else K2_type=kbd;
		if(layout_table_view) view_keyboard(K2_type);
	}
	else if(KE=='K3') {
		if(!kbd) ohiChange_K3();
		else K3_type=kbd;
		if(layout_table_view) view_keyboard(K3_type);
	}
	ohiStart();
}

function url_query() {
	var field, value;
	var address = unescape(location.href); 
	var fields = (address.slice(address.indexOf('?')+1,address.length)).split('&');
	for(var i=0; i<fields.length; ++i){
		field = fields[i].toLowerCase().split('=')[0];
		value = fields[i].split('=')[1];
		if(value==undefined || value==null) continue;
		if(field == 'kbd') {
			if(value.toUpperCase()=='QWERTY' || value.toUpperCase()=='QWERTZ' || value.toUpperCase()=='AZERTY')
				ohiStart(ohi_KE_Status.substr(0,2)+':'+value.toUpperCase());
		}
		if(field == 'en')	{
			En_type = value.toLowerCase();
			menu_toggle('En',En_type);
		}
		if(field == 'k2')	{
			K2_type = value.toLowerCase();
			menu_toggle('K2',K2_type);
		}
		if(field == 'k3')	{
			K3_type = value.toLowerCase();
			menu_toggle('K3',K3_type);
		}
	}
}

function clickTableKey(key_num, dk, uk){
	inputText_focus();
	var c, f = document.getElementById('inputText');
	var n=f.nodeName||f.tagName;
	if(!f || n!='TEXTAREA') return false;
			
	KBD=ohi_KE_Status.substr(3);
	KE=ohi_KE_Status.substr(0,2);

	var capslock = document.getElementById('key28');
	var shift1 = document.getElementById('key41');
	var shift2 = document.getElementById('key52');

	if(dk==20) {	// 배열표에서 Caps Lock이 눌렸을 때
		if(!capslock_click) {
			capslock.style.backgroundColor = 'orange';
			capslock_click = 1;
		}
		else {
			capslock.style.backgroundColor = '';
			capslock_click = 0;
		}
	}
	if(dk==16 && !shift_click) {	// 배열표에서 윗글쇠가 눌렸을 때
		shift_click = 1;
		shift1.style.backgroundColor = 'orange';
		shift2.style.backgroundColor = 'orange';
		return;
	}
	if((dk==32 || dk==13 || dk==9) && !shift_click) {	// 사이띄개(32), 줄바꾸개(13), Tab(9)
		esc_ext_layout();
		ohiInsert(f,0,dk);
		return;
	}
	if(dk==8 && !shift_click) {	// Backspace
		if(ohiQ[1] || ohiQ[3] || ohiQ[0] && ohiQ[2]) { // 한글 조합 상태일 때
			for(var i=5; !ohiQ[i];) i--;
			backspace(f);
			ohiInsert(f,ohiQ[i]=0,ohiQ);
			shift_click = 0;
		}
		else {
			backspace(f);
			inputText_focus();
		}
		esc_ext_layout();
		return;
	}
	
	if(dk==-1) {	// 기준 자판 바꾸기
		ohiChange_KBD();
		inputText_focus();
	}
	if(dk==-2) {	// 2벌식 자판 한·영 상태 바꾸기
		ohiChange_KE('K2');
		inputText_focus();
	}
	if(dk==-3) {	// 3벌식 자판 한·영 상태 바꾸기
		ohiChange_KE('K3');
		inputText_focus();
	}
	if(dk==-11) menu_toggle('En',''); // 영문 자판 바꾸기
	if(dk==-12) menu_toggle('K2',''); // 2벌식 자판 바꾸기
	if(dk==-13) menu_toggle('K3',''); // 3벌식 자판 바꾸기
	if(dk==-13) menu_toggle('K3',''); // 3벌식 자판 바꾸기
	
	if((shift_click+capslock_click)%2) c=uk; else c=dk;
	if(ohi_KE_Status.substr(0,2)=='En' && c>32 && c<127) ohiRoman(f,c,0);
	if(ohi_KE_Status.substr(0,2)!='En' && c>32 && c<127) {
		if(document.selection && document.selection.createRange().text.length!=1) ohiQ=Array(0,0,0,0,0,0);
		if(f.selectionEnd+1 && f.selectionEnd-f.selectionStart!=1) ohiQ=Array(0,0,0,0,0,0);
		if(ohi_KE_Status.substr(0,2)=='K2') ohiHangeul2(f,c);
		if(ohi_KE_Status.substr(0,2)=='K3') {
			inputText_focus();
			ohiHangeul3(f,c);
			inputText_focus();
		}
	}

	for(var j=0;j<dkey.length;++j) {
		var key_td =document.getElementById('key'+j);
		key_td.className = key_td.className.substr(0,2);
	}
	
	if(dk!=16 && dk!=20) document.getElementById('key'+key_num).className = document.getElementById('key'+key_num).className+' clicked';

	shift_click = 0;
	shift1.style.backgroundColor = '';
	shift2.style.backgroundColor = '';
}

function keyboard_layout_info() {
	// 쿼티 자판 아랫글 배열
	dkey = Array(96,49,50,51,52,53,54,55,56,57,48,45,61,8,
	9,113,119,101,114,116,121,117,105,111,112,91,93,92,
	20,97,115,100,102,103,104,106,107,108,59,39,13,
	16,122,120,99,118,98,110,109,44,46,47,16,
	-11,-12,-13,32,-2,-3,-1);

	// 쿼티 자판 윗글 배열
	ukey = Array(126,33,64,35,36,37,94,38,42,40,41,95,43,8,
	9,81,87,69,82,84,89,85,73,79,80,123,125,124,
	20,65,83,68,70,71,72,74,75,76,58,34,13,
	16,90,88,67,86,66,78,77,60,62,63,16,
	-11,-12,-13,32,-2,-3,-1);

	// 3-90 자판
	K3_90_layout = Array(/*!*/24,/*"*/34,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/155,/*(*/40,
	/*)*/41,/***/42,/*+*/43,/*,*/44,/*-*/45,/*.*/46,/*/*/74,/*0*/154,
	/*1*/30,/*2*/22,/*3*/18,/*4*/78,/*5*/83,/*6*/68,/*7*/73,/*8*/85,/*9*/79,
	/*:*/58,/*;*/145,/*<*/50,/*=*/61,/*>*/51,/*?*/63,/*@*/64,
	/*A*/7,/*B*/33,/*C*/11,/*D*/10,/*E*/27,/*F*/2,/*G*/47,/*H*/39,
	/*I*/56,/*J*/52,/*K*/53,/*L*/54,/*M*/49,/*N*/48,/*O*/57,/*P*/62,
	/*Q*/29,/*R*/69,/*S*/6,/*T*/59,/*U*/55,/*V*/16,/*W*/28,/*X*/20,
	/*Y*/60,/*Z*/26,/*[*/91,/*\*/92,/*]*/93,/*^*/94,/*_*/95,/*`*/96,
	/*a*/23,/*b*/79,/*c*/71,/*d*/86,/*e*/72,/*f*/66,/*g*/84,/*h*/131,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156,
	/*q*/21,/*r*/67,/*s*/4,/*t*/70,/*u*/134,/*v*/74,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/123,/*|*/124,/*}*/125,/*~*/126);

	// 순아래 자판
	K3_sun_layout = Array(/*!*/33,/*"*/34,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/155,/*(*/40,
	/*)*/41,/***/42,/*+*/43,/*,*/44,/*-*/24,/*.*/46,/*/*/7,/*0*/69,
	/*1*/30,/*2*/22,/*3*/18,/*4*/78,/*5*/83,/*6*/68,/*7*/73,/*8*/85,/*9*/154,
	/*:*/58,/*;*/145,/*<*/50,/*=*/26,/*>*/51,/*?*/63,/*@*/64,
	/*A*/23,/*B*/33,/*C*/92,/*D*/93,/*E*/72,/*F*/66,/*G*/47,/*H*/39,
	/*I*/56,/*J*/52,/*K*/53,/*L*/54,/*M*/49,/*N*/48,/*O*/57,/*P*/62,
	/*Q*/21,/*R*/67,/*S*/91,/*T*/59,/*U*/55,/*V*/74,/*W*/9,/*X*/61,
	/*Y*/60,/*Z*/45,/*[*/28,/*\*/27,/*]*/29,/*^*/94,/*_*/95,/*`*/96,
	/*a*/23,/*b*/79,/*c*/71,/*d*/86,/*e*/72,/*f*/66,/*g*/84,/*h*/131,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156,
	/*q*/21,/*r*/67,/*s*/4,/*t*/70,/*u*/134,/*v*/74,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/123,/*|*/124,/*}*/125,/*~*/126);

	// 3-91 자판 (공병우 최종 자판)
	K3_91_layout = Array(/*!*/2,/*"*/183,/*#*/24,/*$*/15,/*%*/14,/*&*/8220,/*'*/155,/*(*/39,
	/*)*/126,/***/8221,/*+*/43,/*,*/44,/*-*/41,/*.*/46,/*/*/74,/*0*/154,
	/*1*/30,/*2*/22,/*3*/18,/*4*/78,/*5*/83,/*6*/68,/*7*/73,/*8*/85,/*9*/79,
	/*:*/52,/*;*/145,/*<*/44,/*=*/62,/*>*/46,/*?*/33,/*@*/10,
	/*A*/7,/*B*/63,/*C*/27,/*D*/12,/*E*/5,/*F*/11,/*G*/69,/*H*/48,
	/*I*/55,/*J*/49,/*K*/50,/*L*/51,/*M*/34,/*N*/45,/*O*/56,/*P*/57,
	/*Q*/29,/*R*/16,/*S*/6,/*T*/13,/*U*/54,/*V*/3,/*W*/28,/*X*/20,
	/*Y*/53,/*Z*/26,/*[*/40,/*\*/58,/*]*/60,/*^*/61,/*_*/59,/*`*/42,
	/*a*/23,/*b*/79,/*c*/71,/*d*/86,/*e*/72,/*f*/66,/*g*/84,/*h*/131,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156,
	/*q*/21,/*r*/67,/*s*/4,/*t*/70,/*u*/134,/*v*/74,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/37,/*|*/92,/*}*/47,/*~*/8251);

	// 3-2011 자판
	K3_2011_layout = Array(/*!*/2,/*"*/37,/*#*/5,/*$*/36,/*%*/35,/*&*/38,/*'*/155,/*(*/40,
	/*)*/41,/***/126,/*+*/43,/*,*/44,/*-*/91,/*.*/46,/*/*/74,/*0*/154,
	/*1*/30,/*2*/22,/*3*/18,/*4*/78,/*5*/83,/*6*/68,/*7*/73,/*8*/85,
	/*9*/79,/*:*/52,/*;*/145,/*<*/60,/*=*/93,/*>*/62,/*?*/63,/*@*/10,
	/*A*/7,/*B*/64,/*C*/27,/*D*/12,/*E*/24,/*F*/11,/*G*/33,/*H*/48,
	/*I*/55,/*J*/49,/*K*/50,/*L*/51,/*M*/34,/*N*/39,/*O*/56,/*P*/57,
	/*Q*/29,/*R*/16,/*S*/6,/*T*/69,/*U*/54,/*V*/3,/*W*/28,/*X*/20,
	/*Y*/53,/*Z*/26,/*[*/183,/*\*/61,/*]*/58,/*^*/94,/*_*/42,/*`*/59,
	/*a*/23,/*b*/79,/*c*/71,/*d*/86,/*e*/72,/*f*/66,/*g*/84,/*h*/131,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156,
	/*q*/21,/*r*/70,/*s*/4,/*t*/67,/*u*/134,/*v*/74,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/45,/*|*/92,/*}*/47,/*~*/95);
	
	// 3-2011 자판 특수기호 확장 배열 (첫째 단)
	K3_2011_extended_layout1 = Array(/*!*/0, /*"*/8240, /*#*/0, /*$*/0xFFE0, /*%*/0, /*&*/0, /*'*/0x326B, /*(*/0,
	/*)*/0, /***/0, /*+*/0x2640, /*,*/0x3001, /*-*/0x3010, /*.*/0x3002, /*/*/0x2026, /*0*/0x326A,
	/*1*/0x3BC, /*2*/0xB2, /*3*/0xB3, /*4*/0xFFE6, /*5*/0x20AC, /*6*/0x327E, /*7*/0xA7, /*8*/0,
	/*9*/0, /*:*/0x2463, /*;*/0x3265, /*<*/0, /*=*/0x3011, /*>*/0, /*?*/0, /*@*/0, 
	/*A*/0, /*B*/0, /*C*/0, /*D*/0, /*E*/0x2715, /*F*/0, /*G*/0xA6, /*H*/0x2469,
	/*I*/0x2466, /*J*/0x2460, /*K*/0x2461, /*L*/0x2462, /*M*/0x201D, /*N*/0x201C, /*O*/0x2467, /*P*/0x2468,
	/*Q*/0x2199, /*R*/0xB4, /*S*/0, /*T*/0, /*U*/0x2465, /*V*/0, /*W*/0x2198, /*X*/0,
	/*Y*/0x2464, /*Z*/0, /*[*/0x7B, /*\*/0x2260, /*]*/0x7D, /*^*/0, /*_*/0x2642, /*`*/0xA9,
	/*a*/0x25C7, /*b*/0x2D0, /*c*/0xB0, /*d*/0x25CB, /*e*/0xD7, /*f*/0x2015, /*g*/0x7C, /*h*/0x3261,
	/*i*/0x3264, /*j*/0x3267, /*k*/0x3260, /*l*/0x3268, /*m*/0x326D, /*n*/0x3266, /*o*/0x3269, /*p*/0x326C,
	/*q*/0x2190, /*r*/0x60, /*s*/0x25A1, /*t*/0x3003, /*u*/0x3262, /*v*/0, /*w*/0x2192, /*x*/0x2032,
	/*y*/0x3263, /*z*/0x2033, /*{*/0, /*|*/0, /*}*/0xF7, /*~*/0x0);

	// 3-2011 자판 특수기호 확장 배열 (두째 단)
	K3_2011_extended_layout2 = Array(/*!*/0, /*"*/8241, /*#*/0, /*$*/0, /*%*/0, /*&*/0, /*'*/0x2030, /*(*/0,
	/*)*/0, /***/0, /*+*/0, /*,*/0x3008, /*-*/0x3014, /*.*/0x3009, /*/*/0x203B, /*0*/0x300D,
	/*1*/0x2122, /*2*/0x2109, /*3*/0x2103, /*4*/0xFFE5, /*5*/0xFFE1, /*6*/0x2702, /*7*/0x300E, /*8*/0x300F,
	/*9*/0x300C, /*:*/0x246D, /*;*/0x2463, /*<*/0, /*=*/0x3015, /*>*/0, /*?*/0, /*@*/0, 
	/*A*/0, /*B*/0, /*C*/0, /*D*/0, /*E*/0, /*F*/0, /*G*/0, /*H*/0x2473,
	/*I*/0x2470, /*J*/0x246A, /*K*/0x246B, /*L*/0x246C, /*M*/0x2019, /*N*/0x2018, /*O*/0x2471, /*P*/0x2472,
	/*Q*/0x2196, /*R*/0, /*S*/0, /*T*/0, /*U*/0x246F, /*V*/0, /*W*/0x2197, /*X*/0,
	/*Y*/0x246E, /*Z*/0, /*[*/0xB1, /*\*/0x2252, /*]*/0xF7, /*^*/0, /*_*/0, /*`*/0xAE,
	/*a*/0x25C8, /*b*/0x25C1, /*c*/0x260E, /*d*/0x25C9, /*e*/0x2194, /*f*/0x25B3, /*g*/0x25BD, /*h*/0x2469,
	/*i*/0x2466, /*j*/0x2460, /*k*/0x2461, /*l*/0x2462, /*m*/0x300B, /*n*/0x300A, /*o*/0x2467, /*p*/0x2468,
	/*q*/0x2193, /*r*/0x2022, /*s*/0x25A3, /*t*/0x2713, /*u*/0x2465, /*v*/0x25B7, /*w*/0x2191, /*x*/0x2606,
	/*y*/0x2464, /*z*/0x2661, /*{*/0, /*|*/0, /*}*/0, /*~*/0);

	// 3-2011 자판 특수기호 확장 배열 (세째 단)
	K3_2011_extended_layout3 = Array(/*!*/0, /*"*/0, /*#*/0, /*$*/0, /*%*/0, /*&*/0, /*'*/0x2031, /*(*/0,
	/*)*/0, /***/0, /*+*/0, /*,*/0, /*-*/0x2642, /*.*/0, /*/*/0, /*0*/0,
	/*1*/0, /*2*/0, /*3*/0, /*4*/0x4B0, /*5*/0, /*6*/0, /*7*/0, /*8*/0,
	/*9*/0, /*:*/0x3254, /*;*/0x246D, /*<*/0, /*=*/0x2640, /*>*/0, /*?*/0, /*@*/0,
	/*A*/0, /*B*/0, /*C*/0, /*D*/0, /*E*/0, /*F*/0, /*G*/0, /*H*/0x325A,
	/*I*/0x3257, /*J*/0x3251, /*K*/0x3252, /*L*/0x3253, /*M*/0, /*N*/0, /*O*/0x3258, /*P*/0x3259,
	/*Q*/0x261F, /*R*/0, /*S*/0, /*T*/0, /*U*/0x3256, /*V*/0, /*W*/0x261D, /*X*/0,
	/*Y*/0x3255, /*Z*/0, /*[*/0, /*\*/0xB6, /*]*/0, /*^*/0, /*_*/0, /*`*/0,
	/*a*/0x25C6, /*b*/0x25C0, /*c*/0x260F, /*d*/0x25CF, /*e*/0x2195, /*f*/0x25B2, /*g*/0x25BC, /*h*/0x2473,
	/*i*/0x2470, /*j*/0x246A, /*k*/0x246B, /*l*/0x246C, /*m*/0, /*n*/0, /*o*/0x2471, /*p*/0x2472,
	/*q*/0x261C, /*r*/0, /*s*/0x25A0, /*t*/0, /*u*/0x246F, /*v*/0x25B6, /*w*/0x261E, /*x*/0x2605,
	/*y*/0x246E, /*z*/0x2665, /*{*/0, /*|*/0, /*}*/0, /*~*/0);
	
	// 3-2012 자판
	K3_2012_layout = Array(/*!*/33,/*"*/47,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/155,/*(*/40,
	/*)*/41,/***/42,/*+*/43,/*,*/44,/*-*/45,/*.*/46,/*/*/74,/*0*/154,
	/*1*/30,/*2*/22,/*3*/18,/*4*/78,/*5*/83,/*6*/68,/*7*/73,/*8*/85,
	/*9*/79,/*:*/52,/*;*/145,/*<*/60,/*=*/61,/*>*/62,/*?*/63,/*@*/64,
	/*A*/7,/*B*/59,/*C*/27,/*D*/10,/*E*/24,/*F*/11,/*G*/58,/*H*/48,
	/*I*/55,/*J*/49,/*K*/50,/*L*/51,/*M*/34,/*N*/39,/*O*/56,/*P*/57,
	/*Q*/29,/*R*/16,/*S*/6,/*T*/69,/*U*/54,/*V*/2,/*W*/28,/*X*/20,
	/*Y*/53,/*Z*/26,/*[*/91,/*\*/92,/*]*/93,/*^*/94,/*_*/95,/*`*/96,
	/*a*/23,/*b*/79,/*c*/71,/*d*/86,/*e*/72,/*f*/66,/*g*/84,/*h*/131,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156,
	/*q*/21,/*r*/70,/*s*/4,/*t*/67,/*u*/134,/*v*/74,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/123,/*|*/124,/*}*/125,/*~*/126);
	
	// 3-2012 자판 특수기호 확장 배열 (첫째 단)
	K3_2012_extended_layout1 = Array(/*!*/0, /*"*/0xF7, /*#*/0, /*$*/0xFFE0, /*%*/8240, /*&*/0, /*'*/0x326B, /*(*/0,
	/*)*/0, /***/0, /*+*/0, /*,*/0x3001, /*-*/0xB1, /*.*/0x3002, /*/*/0x2026, /*0*/0x326A,
	/*1*/0x3BC, /*2*/0xB2, /*3*/0xB3, /*4*/0xFFE6, /*5*/0x20AC, /*6*/0x327E, /*7*/0xA7, /*8*/0,
	/*9*/0, /*:*/0x2463, /*;*/0x3265, /*<*/0, /*=*/0x2260, /*>*/0, /*?*/0, /*@*/0, 
	/*A*/0, /*B*/0, /*C*/0, /*D*/0, /*E*/0x2715, /*F*/0, /*G*/0xA6, /*H*/0x2469,
	/*I*/0x2466, /*J*/0x2460, /*K*/0x2461, /*L*/0x2462, /*M*/0x201D, /*N*/0x201C, /*O*/0x2467, /*P*/0x2468,
	/*Q*/0x2199, /*R*/0, /*S*/0, /*T*/0, /*U*/0x2465, /*V*/0, /*W*/0x2198, /*X*/0,
	/*Y*/0x2464, /*Z*/0, /*[*/0x3010, /*\*/0x2252, /*]*/0x3011, /*^*/0, /*_*/0, /*`*/0xA9,
	/*a*/0x25C7, /*b*/0x2D0, /*c*/0xB0, /*d*/0x25CB, /*e*/0xD7, /*f*/0xB7, /*g*/0x2015, /*h*/0x3261,
	/*i*/0x3264, /*j*/0x3267, /*k*/0x3260, /*l*/0x3268, /*m*/0x326D, /*n*/0x3266, /*o*/0x3269, /*p*/0x326C,
	/*q*/0x2190, /*r*/0xB4, /*s*/0x25A1, /*t*/0x3003, /*u*/0x3262, /*v*/0, /*w*/0x2192, /*x*/0x2032,
	/*y*/0x3263, /*z*/0x2033, /*{*/0, /*|*/0, /*}*/0, /*~*/0x0);

	// 3-2012 자판 특수기호 확장 배열 (두째 단)
	K3_2012_extended_layout2 = Array(/*!*/0, /*"*/0, /*#*/0, /*$*/0, /*%*/8241, /*&*/0, /*'*/0xF7, /*(*/0,
	/*)*/0, /***/0, /*+*/0, /*,*/0x3008, /*-*/0x2642, /*.*/0x3009, /*/*/0x203B, /*0*/0x300D,
	/*1*/0x2122, /*2*/0x2109, /*3*/0x2103, /*4*/0xFFE5, /*5*/0x2030, /*6*/0x2702, /*7*/0x300E, /*8*/0x300F,
	/*9*/0x300C, /*:*/0x246D, /*;*/0x2463, /*<*/0, /*=*/0x2640, /*>*/0, /*?*/0, /*@*/0, 
	/*A*/0, /*B*/0, /*C*/0, /*D*/0, /*E*/0, /*F*/0, /*G*/0, /*H*/0x2473,
	/*I*/0x2470, /*J*/0x246A, /*K*/0x246B, /*L*/0x246C, /*M*/0x2019, /*N*/0x2018, /*O*/0x2471, /*P*/0x2472,
	/*Q*/0x2196, /*R*/0, /*S*/0, /*T*/0, /*U*/0x246F, /*V*/0, /*W*/0x2197, /*X*/0,
	/*Y*/0x246E, /*Z*/0, /*[*/0x3014, /*\*/0xB6, /*]*/0x3015, /*^*/0, /*_*/0, /*`*/0xAE,
	/*a*/0x25C8, /*b*/0x25C1, /*c*/0x260E, /*d*/0x25C9, /*e*/0x2194, /*f*/0x25B3, /*g*/0x25BD, /*h*/0x2469,
	/*i*/0x2466, /*j*/0x2460, /*k*/0x2461, /*l*/0x2462, /*m*/0x300B, /*n*/0x300A, /*o*/0x2467, /*p*/0x2468,
	/*q*/0x2193, /*r*/0x2022, /*s*/0x25A3, /*t*/0x2713, /*u*/0x2465, /*v*/0x25B7, /*w*/0x2191, /*x*/0x2606,
	/*y*/0x2464, /*z*/0x2661, /*{*/0, /*|*/0, /*}*/0, /*~*/0);

	// 3-2012 자판 특수기호 확장 배열 (세째 단)
	K3_2012_extended_layout3 = Array(/*!*/0, /*"*/0, /*#*/0, /*$*/0, /*%*/0, /*&*/0, /*'*/0, /*(*/0,
	/*)*/0, /***/0, /*+*/0, /*,*/0, /*-*/0, /*.*/0, /*/*/0, /*0*/0,
	/*1*/0, /*2*/0, /*3*/0, /*4*/0x4B0, /*5*/0x2031, /*6*/0, /*7*/0, /*8*/0,
	/*9*/0, /*:*/0x3254, /*;*/0x246D, /*<*/0, /*=*/0, /*>*/0, /*?*/0, /*@*/0,
	/*A*/0, /*B*/0, /*C*/0, /*D*/0, /*E*/0, /*F*/0, /*G*/0, /*H*/0x325A,
	/*I*/0x3257, /*J*/0x3251, /*K*/0x3252, /*L*/0x3253, /*M*/0, /*N*/0, /*O*/0x3258, /*P*/0x3259,
	/*Q*/0x261F, /*R*/0, /*S*/0, /*T*/0, /*U*/0x3256, /*V*/0, /*W*/0x261D, /*X*/0,
	/*Y*/0x3255, /*Z*/0, /*[*/0, /*\*/0, /*]*/0, /*^*/0, /*_*/0, /*`*/0,
	/*a*/0x25C6, /*b*/0x25C0, /*c*/0x260F, /*d*/0x25CF, /*e*/0x2195, /*f*/0x25B2, /*g*/0x25BC, /*h*/0x2473,
	/*i*/0x2470, /*j*/0x246A, /*k*/0x246B, /*l*/0x246C, /*m*/0, /*n*/0, /*o*/0x2471, /*p*/0x2472,
	/*q*/0x261C, /*r*/0, /*s*/0x25A0, /*t*/0, /*u*/0x246F, /*v*/0x25B6, /*w*/0x261E, /*x*/0x2605,
	/*y*/0x246E, /*z*/0x2665, /*{*/0, /*|*/0, /*}*/0, /*~*/0);

	// 신세벌 2003 자판 (박경남 수정 신세벌식 자판)
	K3_Sin3_2003_layout = Array(/*!*/33,/*"*/34,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/155,/*(*/40,
	/*)*/41,/***/42,/*+*/43,/*,*/44,/*-*/45,/*.*/46,/*/*/154,/*0*/48,
	/*1*/49,/*2*/50,/*3*/51,/*4*/52,/*5*/53,/*6*/54,/*7*/55,/*8*/56,/*9*/57,
	/*:*/58,/*;*/145,/*<*/60,/*=*/61,/*>*/62,/*?*/63,/*@*/64,
	/*A*/83/*ㅠ*/,/*B*/79/*ㅜ*/,/*C*/71/*ㅔ*/,/*D*/86/*ㅣ*/,/*E*/72/*ㅕ*/,/*F*/66/*ㅏ*/,/*G*/84/*ㅡ*/,/*H*/8216,
	/*I*/85/*ㅢ*/,/*J*/8217,/*K*/59/*;*/,/*L*/39/*'*/,/*M*/47,/*N*/183,/*O*/79/*ㅜ*/,/*P*/74/*ㅗ*/,
	/*Q*/69/*ㅒ*/,/*R*/67/*ㅐ*/,/*S*/73/*ㅖ*/,/*T*/70/*ㅓ*/,/*U*/8221,/*V*/74/*ㅗ*/,/*W*/68/*ㅑ*/,/*X*/78/*ㅛ*/,
	/*Y*/8220,/*Z*/8251,/*[*/91,/*\*/92,/*]*/93,/*^*/94,/*_*/95,/*`*/96,
	/*a*/23,/*b*/27/*ㅋ*/,/*c*/26/*ㅊ*/,/*d*/7/*ㄷ*/,/*e*/18/*ㅂ*/,/*f*/22/*ㅆ*/,/*g*/24/*ㅈ*/,/*h*/131/*ㄴ*/,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156/*ㅍ*/,
	/*q*/21,/*r*/28/*ㅌ*/,/*s*/4/*ㄴ*/,/*t*/29/*ㅍ*/,/*u*/134,/*v*/30/*ㅎ*/,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/123,/*|*/124,/*}*/125,/*~*/126);

	// 신세벌 2003 자판 겹받침 확장 배열
	K3_Sin3_2003_layout2 = Array(/*!*/0,/*"*/0,/*#*/0,/*$*/0,/*%*/0,/*&*/0,/*'*/0,/*(*/0,
	/*)*/0,/***/0,/*+*/0,/*,*/0,/*-*/0,/*.*/0,/*/*/0,/*0*/0,
	/*1*/0,/*2*/0,/*3*/0,/*4*/0,/*5*/0,/*6*/0,/*7*/0,/*8*/0,/*9*/0,
	/*:*/0,/*;*/0,/*<*/0,/*=*/0,/*>*/0,/*?*/0,/*@*/0,
	/*A*/20/*ㅄ*/,/*B*/0,/*C*/3/*ㄳ*/,/*D*/5/*ㄵ*/,/*E*/12/*ㄼ*/,/*F*/0,/*G*/0,/*H*/0,
	/*I*/0,/*J*/0,/*K*/0,/*L*/0,/*M*/0,/*N*/0,/*O*/0,/*P*/0,
	/*Q*/13/*ㄽ*/,/*R*/14/*ㄾ*/,/*S*/6/*ㄶ*/,/*T*/15/*ㄿ*/,/*U*/0,/*V*/16/*ㅀ*/,/*W*/10/*ㄺ*/,/*X*/2/*ㄲ*/,
	/*Y*/0,/*Z*/11/*ㄻ*/,/*[*/0,/*\*/0,/*]*/0,/*^*/0,/*_*/0,/*`*/0,
	/*a*/0,/*b*/0,/*c*/0,/*d*/0,/*e*/0,/*f*/0,/*g*/0,/*h*/0,
	/*i*/0,/*j*/0,/*k*/0,/*l*/0,/*m*/0,/*n*/0,/*o*/0,/*p*/0,
	/*q*/0,/*r*/0,/*s*/0,/*t*/0,/*u*/0,/*v*/0,/*w*/0,/*x*/0,
	/*y*/0,/*z*/0,/*{*/0,/*|*/0,/*}*/0,/*~*/0);

	// 신세벌 2012 자판
	K3_Sin3_2012_layout = Array(/*!*/33,/*"*/47,/*#*/35,/*$*/36,/*%*/37,/*&*/38,/*'*/155,/*(*/40,
	/*)*/41,/***/42,/*+*/43,/*,*/44,/*-*/45,/*.*/46,/*/*/154,/*0*/48,
	/*1*/49,/*2*/50,/*3*/51,/*4*/52,/*5*/53,/*6*/54,/*7*/55,/*8*/56,/*9*/57,
	/*:*/58,/*;*/145,/*<*/60,/*=*/61,/*>*/62,/*?*/63,/*@*/64,
	/*A*/83/*ㅠ*/,/*B*/79/*ㅜ*/,/*C*/71/*ㅔ*/,/*D*/86/*ㅣ*/,/*E*/72/*ㅕ*/,/*F*/66/*ㅏ*/,/*G*/84/*ㅡ*/,/*H*/9633/*□*/,
	/*I*/85/*ㅢ*/,/*J*/8213/*―*/,/*K*/183/*·*/,/*L*/59/*;*/,/*M*/34,/*N*/39,/*O*/79/*ㅜ*/,/*P*/74/*ㅗ*/,
	/*Q*/69/*ㅒ*/,/*R*/70/*ㅓ*/,/*S*/73/*ㅖ*/,/*T*/67/*ㅐ*/,/*U*/9675,/*V*/74/*ㅗ*/,/*W*/68/*ㅑ*/,/*X*/78/*ㅛ*/,
	/*Y*/215,/*Z*/0x318D/*127*/,/*[*/91,/*\*/92,/*]*/93,/*^*/94,/*_*/95,/*`*/96,
	/*a*/23,/*b*/29/*ㅍ*/,/*c*/27/*ㅋ*/,/*d*/22/*ㅆ*/,/*e*/18/*ㅂ*/,/*f*/26/*ㅊ*/,/*g*/24/*ㅈ*/,/*h*/131/*ㄴ*/,
	/*i*/144,/*j*/150,/*k*/128,/*l*/151,/*m*/157,/*n*/148,/*o*/153,/*p*/156/*ㅍ*/,
	/*q*/21,/*r*/28/*ㅌ*/,/*s*/4/*ㄴ*/,/*t*/7/*ㄷ*/,/*u*/134,/*v*/30/*ㅎ*/,/*w*/9,/*x*/1,
	/*y*/136,/*z*/17,/*{*/123,/*|*/124,/*}*/125,/*~*/126);

	// 신세벌 2012 자판 겹받침 확장 배열
	K3_Sin3_2012_layout2 = Array(/*!*/0,/*"*/0,/*#*/0,/*$*/0,/*%*/0,/*&*/0,/*'*/0,/*(*/0,
	/*)*/0,/***/0,/*+*/0,/*,*/0,/*-*/0,/*.*/0,/*/*/0,/*0*/0,
	/*1*/0,/*2*/0,/*3*/0,/*4*/0,/*5*/0,/*6*/0,/*7*/0,/*8*/0,/*9*/0,
	/*:*/0,/*;*/0,/*<*/0,/*=*/0,/*>*/0,/*?*/0,/*@*/0,
	/*A*/20/*ㅄ*/,/*B*/15/*ㄿ*/,/*C*/3/*ㄳ*/,/*D*/5/*ㄵ*/,/*E*/12/*ㄼ*/,/*F*/0,/*G*/0,/*H*/0,
	/*I*/0,/*J*/0,/*K*/0,/*L*/0,/*M*/0,/*N*/0,/*O*/0,/*P*/0,
	/*Q*/13/*ㄽ*/,/*R*/14/*ㄾ*/,/*S*/6/*ㄶ*/,/*T*/0,/*U*/0,/*V*/16/*ㅀ*/,/*W*/10/*ㄺ*/,/*X*/2/*ㄲ*/,
	/*Y*/0,/*Z*/11/*ㄻ*/,/*[*/0,/*\*/0,/*]*/0,/*^*/0,/*_*/0,/*`*/0,
	/*a*/0,/*b*/0,/*c*/0,/*d*/0,/*e*/0,/*f*/0,/*g*/0,/*h*/0,
	/*i*/0,/*j*/0,/*k*/0,/*l*/0,/*m*/0,/*n*/0,/*o*/0,/*p*/0,
	/*q*/0,/*r*/0,/*s*/0,/*t*/0,/*u*/0,/*v*/0,/*w*/0,/*x*/0,
	/*y*/0,/*z*/0,/*{*/0,/*|*/0,/*}*/0,/*~*/0);
	
	// 신세벌 자판 확장기호 배열 (첫째 단)
	K3_Sin3_extended_layout1 = Array(/*!*/0,/*"*/0,/*#*/0,/*$*/0,/*%*/0,/*&*/0,/*'*/0x326B,/*(*/0,
	/*)*/0,/***/0,/*+*/0,/*,*/0x3001,/*-*/0xB1,/*.*/0x3002,/*/*/0x326A,/*0*/0xA7,
	/*1*/0x3BC,/*2*/0xB2,/*3*/0xB3 ,/*4*/0xFFE6,/*5*/0xFFE5,/*6*/0x321C,/*7*/0xFFE1,/*8*/0x20AC,
	/*9*/0xFFE0,/*:*/0,/*;*/0x3265,/*<*/0,/*=*/0x2260,/*>*/0,/*?*/0,/*@*/0,
	/*A*/0,/*B*/0,/*C*/0,/*D*/0,/*E*/0,/*F*/0,/*G*/0,/*H*/0,
	/*I*/0,/*J*/0,/*K*/0,/*L*/0,/*M*/0,/*N*/0,/*O*/0,/*P*/0,
	/*Q*/0,/*R*/0,/*S*/0,/*T*/0,/*U*/0,/*V*/0,/*W*/0,/*X*/0,
	/*Y*/0,/*Z*/0,/*[*/0x3010,/*\*/0x2252,/*]*/0x3011,/*^*/0,/*_*/0,/*`*/0x2122,
	/*a*/0x25C7,/*b*/0xF7,/*c*/0xB0,/*d*/0x25CB,/*e*/0x2199,/*f*/0xB7,/*g*/0x2026,/*h*/0x3261,
	/*i*/0x3264,/*j*/0x3267,/*k*/0x3260,/*l*/0x3268,/*m*/0x326D,/*n*/0x3266,/*o*/0x3269,/*p*/0x326C,
	/*q*/0x2196,/*r*/0x2198,/*s*/0x25A1,/*t*/0x2D0,/*u*/0x3262,/*v*/0xD7,/*w*/0x2197,/*x*/0x2032,
	/*y*/0x3263,/*z*/0x2033,/*{*/0,/*|*/0,/*}*/0,/*~*/0);

	// 신세벌 자판 확장기호 배열 (두째 단)
	K3_Sin3_extended_layout2 = Array(/*!*/0,/*"*/0,/*#*/0,/*$*/0,/*%*/0,/*&*/0,/*'*/0x266A,/*(*/0,
	/*)*/0,/***/0,/*+*/0,/*,*/0x3008,/*-*/0x2642,/*.*/0x3009,/*/*/0x203B,/*0*/0x2469,
	/*1*/0x2460,/*2*/0x2461,/*3*/0x2462,/*4*/0x2463,/*5*/0x2464,/*6*/0x2465,/*7*/0x2466,/*8*/0x2467,
	/*9*/0x2468,/*:*/0,/*;*/0x25BD,/*<*/0,/*=*/0x2640,/*>*/0,/*?*/0,/*@*/0,
	/*A*/0,/*B*/0,/*C*/0,/*D*/0,/*E*/0,/*F*/0,/*G*/0,/*H*/0,
	/*I*/0,/*J*/0,/*K*/0,/*L*/0,/*M*/0,/*N*/0,/*O*/0,/*P*/0,
	/*Q*/0,/*R*/0,/*S*/0,/*T*/0,/*U*/0,/*V*/0,/*W*/0,/*X*/0,
	/*Y*/0,/*Z*/0,/*[*/0x3014,/*\*/0xB6,/*]*/0x3015,/*^*/0,/*_*/0,/*`*/0xA9,
	/*a*/0x25C8,/*b*/0x2030,/*c*/0x260E,/*d*/0x25C9,/*e*/0x2190,/*f*/0x25E6,/*g*/0x2015,/*h*/0x3003,
	/*i*/0x2103,/*j*/0x2018,/*k*/0x2019,/*l*/0x25B3,/*m*/0x300D,/*n*/0x300C,/*o*/0x25B7,/*p*/0x25C1,
	/*q*/0x2193,/*r*/0x2192,/*s*/0x25A3,/*t*/0x2194,/*u*/0x327E,/*v*/0x2715,/*w*/0x2191,/*x*/0x2606,
	/*y*/0x2195,/*z*/0x2661,/*{*/0,/*|*/0,/*}*/0,/*~*/0);

	// 신세벌 자판 확장기호 배열 (세째 단)
	K3_Sin3_extended_layout3 = Array(/*!*/0,/*"*/0,/*#*/0,/*$*/0,/*%*/0,/*&*/0,/*'*/0x266C,/*(*/0,
	/*)*/0,/***/0,/*+*/0,/*,*/0x300A,/*-*/0x2601,/*.*/0x300B,/*/*/0x2620,/*0*/0x2473,
	/*1*/0x246A,/*2*/0x246B,/*3*/0x246C,/*4*/0x246D,/*5*/0x246E,/*6*/0x246F,/*7*/0x2470,/*8*/0x2471,
	/*9*/0x2472,/*:*/0,/*;*/0x25BC,/*<*/0,/*=*/0x2603,/*>*/0,/*?*/0,/*@*/0,
	/*A*/0,/*B*/0,/*C*/0,/*D*/0,/*E*/0,/*F*/0,/*G*/0,/*H*/0x2611,
	/*I*/0,/*J*/0,/*K*/0,/*L*/0,/*M*/0,/*N*/0,/*O*/0,/*P*/0,
	/*Q*/0,/*R*/0,/*S*/0x2610,/*T*/0,/*U*/0,/*V*/0x2612,/*W*/0,/*X*/0,
	/*Y*/0,/*Z*/0,/*[*/0x2600,/*\*/0xA6,/*]*/0x2602,/*^*/0,/*_*/0,/*`*/0xAE,
	/*a*/0x25C6,/*b*/0x2031,/*c*/0x2668,/*d*/0x25CF,/*e*/0x261C,/*f*/0x2022,/*g*/0xFFE3,/*h*/0x2713,
	/*i*/0x2109,/*j*/0x201C,/*k*/0x201D,/*l*/0x25B2,/*m*/0x300F,/*n*/0x300E,/*o*/0x25B6,/*p*/0x25C0,
	/*q*/0x261F,/*r*/0x261E,/*s*/0x25A0,/*t*/0x21C4,/*u*/0x327F,/*v*/0x2702,/*w*/0x261D,/*x*/0x2605,
	/*y*/0x21C5,/*z*/0x2665,/*{*/0,/*|*/0,/*}*/0,/*~*/0);
} 

keyboard_layout_info();
browser_detect();
view_keyboard();
ohiStart('En');
url_query();
