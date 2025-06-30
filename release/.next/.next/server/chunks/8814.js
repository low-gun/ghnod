"use strict";exports.id=8814,exports.ids=[8814],exports.modules={1373:(e,r,t)=>{t.d(r,{Z:()=>createLucideIcon});var a=t(6689);/**
 * @license lucide-react v0.515.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let toKebabCase=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),toCamelCase=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()),toPascalCase=e=>{let r=toCamelCase(e);return r.charAt(0).toUpperCase()+r.slice(1)},mergeClasses=(...e)=>e.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim(),hasA11yProp=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};/**
 * @license lucide-react v0.515.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var s={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.515.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,a.forwardRef)(({color:e="currentColor",size:r=24,strokeWidth:t=2,absoluteStrokeWidth:o,className:l="",children:i,iconNode:c,...n},d)=>(0,a.createElement)("svg",{ref:d,...s,width:r,height:r,stroke:e,strokeWidth:o?24*Number(t)/Number(r):t,className:mergeClasses("lucide",l),...!i&&!hasA11yProp(n)&&{"aria-hidden":"true"},...n},[...c.map(([e,r])=>(0,a.createElement)(e,r)),...Array.isArray(i)?i:[i]])),createLucideIcon=(e,r)=>{let t=(0,a.forwardRef)(({className:t,...s},l)=>(0,a.createElement)(o,{ref:l,iconNode:r,className:mergeClasses(`lucide-${toKebabCase(toPascalCase(e))}`,`lucide-${e}`,t),...s}));return t.displayName=toPascalCase(e),t}},8814:(e,r,t)=>{t.d(r,{Z:()=>s});var a=t(1373);let s=(0,a.Z)("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]])}};