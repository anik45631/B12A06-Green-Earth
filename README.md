1. **var / let / const**
   - `var` is function scoped and can be redeclared. `let` and `const` are block scoped; `let` can be reassigned, `const` cannot.
2. **map / forEach / filter**
   - `map` returns a new array of transformed items; `forEach` iterates with no return value; `filter` returns a new array of items matching a condition.
3. **Arrow functions**
   - Shorter function syntax. They do not bind their own `this`.
4. **Destructuring**
   - Syntax to unpack values from arrays/objects: `const [a,b]=arr; const {x,y}=obj;`
5. **Template literals**
   - Use backticks and `${}` for interpolation, allow multi-line strings, cleaner than `+` concatenation.
