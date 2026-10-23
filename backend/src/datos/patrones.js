// Escapa los comodines de ILIKE para que una búsqueda con % o _ se tome literal.
export function escaparPatron(texto) {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}
