# ent-script

Um Entity Component System feito em Javascript

## O que é um Entity Component System (ECS)

Entity Component System é um modelo de arquitetura usada para organizar logica e dados de forma separada.

Uma de suas principais caracteristicas é usar composição ao invés de herança, permitindo uma atribuição dinamica de componentes em entidades.

Os comportamentos são baseadas em sistemas, que são executados em entidades com um conjunto de componentes. Sistemas podem causar mudanças estruturais nos dados do ECS, adicionando e removendo componentes ou destruindo e criando entidades.

### Elementos do ECS

#### Entidades

Etidades funcionam como um grupo de componentes, podendo ser representada como uma estrutura abstrata, pois apenas identifica os componentes que ela possui.

#### Componentes

Os componentes são o núcleo dos dados no ECS, definem extenções para entidades. São os dados que seram manipulados com os sistemas.

#### Sistemas

Definem o comportamento das entidades com um conjunto de componentes, alterando seus dados e manipulando os elementos do ECS.

### Performance

#### Memória

Com a divisão de lógica e dados, existe a possibilidade de gerenciar a memória utilizada por estes dados de forma inteligente, podendo reduzindo o número de alocações em linguagens de baixo nível ou a pressão sobre o Garbage Collection no Javascript.

Fazendo gerenciamento explícito de memória, o seu layout pode ser arranjado para aproveitar as estruturas mais rápida de cache do processador quando esta executando sistemas, mantendos os dados contíguos e facilitando a leitura sequencial.

#### Multithread

Coordenando a ordem de execução de sistemas, existe o potencial de identificar sistemas que executam em regiões distintas da memória, permitindo a sua execução em paralelo sem ocorrer uma race condition.
