# HootHotline Service Documentation

## Server Structure
### Live Listening for Updates
### Passing Arguments from Server to Frontend
`EJS` allows passing of a set of arguments to the HTML page, as well as running snippets of code. To dynamically place the foods in the appropriate list, the arguments will be passed via a `JSON` dictionary as follows:
- inStock: The string names of foods in stock
- outStock: The string names of foods out of stock


## Database Structure
The database is split into high level categories following the functions of the website. 
- `inventory`: Contains `food : in_stock` pairs, where `in_stock` in a boolean describing if the given food is in stock (`true` if in stock, `false` if not). The keys are the 