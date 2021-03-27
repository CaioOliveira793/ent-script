# ent-script

Um Entity Component System feito em Javascript

## O que é um Entity Component System (ECS)

Entity Component System é um modelo de arquitetura usada para organizar lógica e dados de forma separada.

Uma de suas principais características é usar composição ao invés de herança, permitindo uma atribuição dinâmica de componentes em entidades.

Os comportamentos são baseados em sistemas, que são executados em entidades com um conjunto de componentes. Sistemas podem causar mudanças estruturais nos dados do ECS, adicionando e removendo componentes ou destruindo e criando entidades.

### Elementos do ECS

#### Entidades

Entidades funcionam como um grupo de componentes, que podem ser representadas como estruturas abstratas, pois apenas identificam os componentes que ela possui.

#### Componentes

Os componentes são o núcleo dos dados no ECS, definem extensões para entidades. São os dados que serão manipulados com os sistemas.

#### Sistemas

Definem o comportamento das entidades com um conjunto de componentes, alterando seus dados e manipulando os elementos do ECS.

### Performance

#### Memória

Com a divisão de lógica e dados, existe a possibilidade de gerenciar a memória utilizada por estes dados de forma inteligente, reduzindo o número de alocações em linguagens de baixo nível ou a pressão sobre o Garbage Collection no Javascript.

Fazendo gerenciamento explícito de memória, o seu layout pode ser arranjado para ser [cache-friendly](https://www.geeksforgeeks.org/computer-organization-locality-and-cache-friendly-code/), mantendos os dados contíguos e facilitando a leitura sequencial.

#### Multithread

Coordenando a ordem de execução de sistemas, existe o potencial de identificar sistemas que executam em regiões distintas da memória, permitindo a sua execução em paralelo sem ocorrer uma [race condition](https://en.wikipedia.org/wiki/Race_condition).

## Arquitetura para o futuro do ent-script

### WASM e Javascript

Seguindo os conceitos basicos do ECS, o ent-script pode adaptar sua implementação para um ambiente utilizando Javacript e [Web Assembly (WASM)](https://webassembly.org/), expondo ao Javascript interfaces para definir componentes e sistemas de forma declarativa, e WASM para gerenciar alocações, agrupamento de componentes, ordem de execução e outras responsabilidades de mais baixo nível.

### Comunicação

Fazendo a comunicação entre os dois contextos (WASM e Javascript) utilizando buffers de comando, pode ser extraído mais performance, dando controle da sincronização de mudanças entre os dois sistemas para a aplicação. Entretanto, trás uma maior complexidade para sua implementação e utilização, uma vez que seja permitido o seu controle de forma explícita.

Para uma comunicação baseada em comandos, serão usados 3 CommandBuffers:

#### CommandBuffer

Responsável por descrever mudanças estruturais para o WASM, que executa os comandos atualizando seu estado interno.

#### TransformScheduleBuffer

Para suportar a alteração de valores na construção de componentes gerenciados pelo WASM, são utilizados no Javascript funções de transformação (`transforms`), que recebem referências dos componentes criados em WASM.

O `TransformScheduleBuffer` é quem faz a orquestração de quais e onde os `transforms` devem ser executados.

#### ScriptScheduleBuffer

Por fim, o `ScriptScheduleBuffer` expõe ao Javascript o agendamento de execuções dos scripts, que fazem mudanças estruturais com comandos que são escritos no `CommandBuffer`, reiniciando o ciclo da aplicação.

Permição de leitura e escrita dos buffers:

| Buffer                  | Read | Write |
|:----------------------- |:----:|:-----:|
| CommandBuffer           | WASM |   JS  |
| TransformScheduleBuffer |  JS  |  WASM |
| ScriptScheduleBuffer    |  JS  |  WASM |

## Motivações e Inspirações

Este projeto foi criado com objetivo inicial de aplicar em uma engine para o browser que criei, como uma maneira central de gerenciar os objetos.

Muitos conceitos da arquitetura aplicada possuem inspiração no [Unity ECS](https://docs.unity3d.com/Packages/com.unity.entities@0.17/manual/index.html).
