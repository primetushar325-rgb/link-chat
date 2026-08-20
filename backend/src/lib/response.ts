export function ok<T>(data:T, meta?:any){ return { success:true, data, meta }; }
export function fail(code:string,message:string,details?:any){ return { success:false, error:{code,message,details} }; }
