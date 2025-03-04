export async function getAllMailBox(connection) {
    const boxes = await connection.getBoxes();
    
    if (boxes['[Gmail]'] && boxes['[Gmail]'].children) {
      for (const [name, box] of Object.entries(boxes['[Gmail]'].children)) {
        if (box.attribs.includes('\\All')) {
          return `[Gmail]/${name}`;
        }
      }
    }
  
    return null; 
  }
  