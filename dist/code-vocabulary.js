export const codeVocabulary={
  pos:['calculateTotal()','applyDiscount()','saveSale()','printReceipt()','cart.map()','await saveSale()'],
  picking:['assignPickingTask()','validateCargo()','confirmShipment()','pickList.map()','updatePickingStatus()'],
  inventory:['getInventory()','transferStock()','checkMinimum()','updateWarehouse()','inventory.map()'],
  admin:['getMetrics()','generateReport()','syncData()','renderDashboard()','metrics.map()'],
};
const syntax=['const','function','return','async','await','=>','{ }','if (ready)'];
export function codeToken(product,id){
  const words=codeVocabulary[product]||codeVocabulary.pos;
  return id%4===0?{text:syntax[Math.floor(id/4)%syntax.length],kind:'syntax'}:{text:words[id%words.length],kind:'function'};
}
// Each grain is one bit; identity stays stable throughout its journey into the UI.
export function codeParticle(product,id){
  return {text:String((id^(id>>>2)^(id>>>5))&1),kind:'grain'};
}
export function tailCodeParticle(product,id){
  if(id%37===0)return {...codeToken(product,Math.floor(id/37)+1),kind:'code'};
  const tokens=[';','{','}','(',')','=>','const',';','{}','async','await','return','0','1',';',':','0','1','(',')',';','0','1',';'];
  return {text:tokens[id%tokens.length],kind:'code'};
}
export function fragmentOverlaps(p,fontSize,rect,padding=5){
  const halfWidth=p.text.length*fontSize*.31+3,angle=p.rotation||0,c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
  const w=halfWidth*c+fontSize*s,h=halfWidth*s+fontSize*c;
  const right=rect.right??rect.left+rect.width,bottom=rect.bottom??rect.top+rect.height;
  return p.x+w>rect.left-padding&&p.x-w<right+padding&&p.y+h>rect.top-padding&&p.y-h<bottom+padding;
}
