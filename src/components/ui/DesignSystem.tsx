"use client";

import type {ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes} from "react";

type ButtonVariant="primary"|"secondary"|"outline"|"ghost"|"danger";
type ButtonSize="sm"|"md"|"lg";
export function DSButton({variant="primary",size="md",loading=false,children,className="",disabled,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:ButtonVariant;size?:ButtonSize;loading?:boolean}){
 return <button {...props} type={props.type??"button"} disabled={disabled||loading} aria-busy={loading||undefined} className={["ds-button","ds-button--"+variant,"ds-button--"+size,className].filter(Boolean).join(" ")}>{loading?<span className="ds-spinner" aria-hidden="true"/>:null}{children}</button>;
}
export function DSCard({children,className="",...props}:HTMLAttributes<HTMLElement>){
 return <section {...props} className={["ds-card",className].filter(Boolean).join(" ")}>{children}</section>;
}
export function DSStatCard({label,value,detail,icon}:{label:string;value:string;detail?:string;icon?:ReactNode}){
 return <div className="ds-stat"><div className="ds-stat__header"><span>{label}</span>{icon?<span aria-hidden="true">{icon}</span>:null}</div><strong className="ds-stat__number">{value}</strong>{detail?<small>{detail}</small>:null}</div>;
}
type BadgeTone="neutral"|"success"|"warning"|"danger"|"info";
export function DSBadge({tone="neutral",children}:{tone?:BadgeTone;children:ReactNode}){
 return <span className={"ds-badge ds-badge--"+tone}>{children}</span>;
}
export function DSAlert({tone="info",title,children}:{tone?:Exclude<BadgeTone,"neutral">;title:string;children:ReactNode}){
 return <div role={tone==="danger"?"alert":"status"} className={"ds-alert ds-alert--"+tone}><strong>{title}</strong><span>{children}</span></div>;
}
type FieldProps={label:string;hint?:string;error?:string;required?:boolean;id:string};
export function DSTextField({label,hint,error,id,required,className="",...props}:FieldProps&InputHTMLAttributes<HTMLInputElement>){
 const help=error??hint;
 return <div className={"ds-field "+className}><label htmlFor={id}>{label}{required?<span aria-hidden="true"> *</span>:null}</label><input {...props} id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={help?id+"-help":undefined}/>{help?<small className={error?"ds-field__error":""} id={id+"-help"}>{help}</small>:null}</div>;
}
export function DSTextArea({label,hint,error,id,required,className="",...props}:FieldProps&TextareaHTMLAttributes<HTMLTextAreaElement>){
 const help=error??hint;
 return <div className={"ds-field "+className}><label htmlFor={id}>{label}{required?<span aria-hidden="true"> *</span>:null}</label><textarea {...props} id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={help?id+"-help":undefined}/>{help?<small className={error?"ds-field__error":""} id={id+"-help"}>{help}</small>:null}</div>;
}
export function DSSelect({label,hint,error,id,required,children,className="",...props}:FieldProps&SelectHTMLAttributes<HTMLSelectElement>){
 const help=error??hint;
 return <div className={"ds-field "+className}><label htmlFor={id}>{label}{required?<span aria-hidden="true"> *</span>:null}</label><select {...props} id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={help?id+"-help":undefined}>{children}</select>{help?<small className={error?"ds-field__error":""} id={id+"-help"}>{help}</small>:null}</div>;
}
export function DSTabs<T extends string>({options,value,onChange,ariaLabel}:{options:readonly {value:T;label:string}[];value:T;onChange:(v:T)=>void;ariaLabel:string}){
 return <div className="ds-tabs" role="group" aria-label={ariaLabel}>{options.map(option=><button key={option.value} type="button" aria-pressed={value===option.value} className={value===option.value?"ds-tabs__item is-active":"ds-tabs__item"} onClick={()=>onChange(option.value)}>{option.label}</button>)}</div>;
}
export type DSConcept="nao_avaliado"|"ruim"|"regular"|"bom"|"otimo";
export const DS_CONCEPTS:ReadonlyArray<{value:DSConcept;label:string;nota:number|null}>=[
 {value:"nao_avaliado",label:"Não avaliado",nota:null},
 {value:"ruim",label:"Ruim",nota:2.5},
 {value:"regular",label:"Regular",nota:5},
 {value:"bom",label:"Bom",nota:7.5},
 {value:"otimo",label:"Ótimo",nota:10},
];
export function DSConceptSelect({id,label,value,onChange,disabled=false}:{id:string;label:string;value:DSConcept;onChange:(v:DSConcept)=>void;disabled?:boolean}){
 return <DSSelect label={label} id={id} value={value} disabled={disabled} onChange={e=>onChange(e.target.value as DSConcept)}>{DS_CONCEPTS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</DSSelect>;
}
