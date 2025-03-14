const startsWith = (a:string, b:string) => a.toLowerCase().startsWith(b.toLowerCase());
const compareStrings = (a:string, b:string) => a.toLowerCase() === b.toLowerCase();
const substring = (a:string, b:string) => a.toLowerCase().includes(b.toLowerCase());

function replaceAll(str: string, find: string, replace: string) {
  function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

const zip = (a: any[], b: any[]) => a.map((elem, i) => [elem, b[i]]);

const simpleHash = (str: string):number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return (hash >>> 0)
};

function isFirstInstance<T>(value: T, index: number, array: T[]){
  return array.indexOf(value) === index;
}

export {startsWith, compareStrings, isFirstInstance, replaceAll, simpleHash, substring, zip};