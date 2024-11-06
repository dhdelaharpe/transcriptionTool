import {Highlight} from '@tiptap/extension-highlight'

import {WordMarkAttributes} from '../../types/general';
//adjust to desired thresholds
const getConfidenceClass = (confidence:number)=>{
    if(confidence>0.8) return 'high';
    if(confidence>0.6) return 'medium';
    return 'low';
};

export const WordMark = Highlight.extend({
    name:'wordMark',
    addAttributes() {
        return{
            confidence:{
                default:null,
                parseHTML:(element:HTMLElement)=> element.getAttribute('data-confidence'),
                renderHTML:(attributes:{confidence:string|null})=>{
                    if(!attributes.confidence)return {};
                    const confidence = parseFloat(attributes.confidence);
                    return{
                        'data-confidence':attributes.confidence,
                        class: `confidence-${getConfidenceClass(confidence)}`,
                    };
                },
            },
            offsetFrom:{
                default:null,
                parseHTML:(element:HTMLElement)=> element.getAttribute('data-offset-from'),
                renderHTML:(attributes:{offsetFrom:string|null})=>{
                    if(!attributes.offsetFrom)return {};
                    return{
                        'data-offset-from':attributes.offsetFrom,
                    };
                },
            },
            offsetTo:{
                default:null,
                parseHTML:(element:HTMLElement)=> element.getAttribute('data-offset-to'),
                renderHTML:(attributes:{offsetTo:string|null})=>{
                    if(!attributes.offsetTo)return {};
                    return{
                        'data-offset-to':attributes.offsetTo,
                    };
                },
            },
            duration:{
                default:null,
                parseHTML:(element:HTMLElement)=> element.getAttribute('data-duration'),
                renderHTML:(attributes:{duration:string|null})=>{
                    if(!attributes.duration)return {};
                    return{
                        'data-duration':attributes.duration,
                    };
                },
            },
            wordIndex:{
                default:null,
                parseHTML:(element:HTMLElement)=> element.getAttribute('data-word-index'),
                renderHTML:(attributes:{wordIndex:string|null})=>{
                    if(!attributes.wordIndex)return {};
                    return{
                        'data-word-index':attributes.wordIndex,
                    };
                },
            },
        };
    },
});