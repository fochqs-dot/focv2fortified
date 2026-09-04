// FOC Inventory Monitor wiring repair
// Replace the existing loadInventoryEditor() in the deployed Worker with this function.
// Uses the existing /api/inventory response for BOTH the editor datalist and Inventory Monitor table.

async function loadInventoryEditor(){

  const r=await fetch(
    "/api/inventory",
    {cache:"no-store"}
  );

  inventoryEditorItems=
    await r.json();

  const l=
    document.getElementById(
      "inventory-selector-list"
    );

  if(l){
    l.innerHTML="";

    inventoryEditorItems.forEach(
      function(item){

        const o=
          document.createElement(
            "option"
          );

        o.value=
          getInventoryLabel(item);

        l.appendChild(o);
      }
    );
  }

  const body=
    document.getElementById(
      "inventory-list-body"
    );

  if(body){

    body.innerHTML="";

    if(
      !Array.isArray(inventoryEditorItems) ||
      inventoryEditorItems.length===0
    ){
      body.innerHTML=
        '<tr><td colspan="4">No inventory items found.</td></tr>';

      return;
    }

    inventoryEditorItems.forEach(
      function(item){

        const tr=
          document.createElement(
            "tr"
          );

        const tdItem=
          document.createElement(
            "td"
          );

        const tdCode=
          document.createElement(
            "td"
          );

        const tdAvailable=
          document.createElement(
            "td"
          );

        const tdCategory=
          document.createElement(
            "td"
          );

        tdItem.textContent=
          item.item||"";

        tdCode.textContent=
          item.code||"";

        tdAvailable.textContent=
          Number(
            item.available||0
          ).toLocaleString();

        tdCategory.textContent=
          item.category||"";

        tr.appendChild(tdItem);
        tr.appendChild(tdCode);
        tr.appendChild(tdAvailable);
        tr.appendChild(tdCategory);

        body.appendChild(tr);
      }
    );
  }
}
