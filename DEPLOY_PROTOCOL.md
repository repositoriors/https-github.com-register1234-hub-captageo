# CaptaGeo Deploy Protocol

Este protocolo existe para evitar publicar uma versao parcial do site.

## Regra principal

Deploy de producao da CaptaGeo deve sair do workspace completo validado, nunca de uma copia limpa do Git sem confirmar que todos os arquivos publicos recentes estao versionados.

Use copia limpa apenas quando o objetivo for testar o pacote rastreado no Git. Antes de promover ou publicar essa copia, valide as rotas criticas abaixo.

## Checklist antes do deploy

1. Rodar a trava local:

```powershell
node ops/predeploy-check.js
```

2. Confirmar rotas criticas locais ou publicas:

- `/`
- `/atlas`
- `/apresentacao/seguro-agricola-capta`
- `/apresentacao/zarc-milho-2-safra-pr`
- `/evidencias/contexto-territorial/layer_atlas`
- `/evidencias/carteira-exposta/layer_atlas`
- `/evidencias/irrigacao-cristalina/layer_atlas`

3. Confirmar que dados publicos nao expoem metodo:

- sem `calibrated_score`
- sem `ndvi_mean`, `ndwi_mean`, `ndmi_mean`
- sem `gate`, `route`, `reviewer`
- sem `field_id`, `lat`, `lon` bruto
- sem CSV publico rastreado

4. Confirmar que `.vercelignore` protege material interno:

- `evidencias/**/data/*.csv`
- `assets/private/**`
- `scripts/**`
- relatorios `.md`
- metricas e arquivos de inteligencia

## Deploy recomendado

Quando houver arquivos publicos ainda nao rastreados no Git, publicar a partir do workspace validado:

```powershell
npx.cmd vercel --prod --yes
```

Quando todos os arquivos publicos estiverem rastreados e o pacote limpo passar no checklist, uma copia limpa pode ser usada.

## Validacao depois do deploy

Checar:

- Home responde `200`
- `/atlas` responde `200`
- apresentacoes respondem `200`
- atlas novo responde `200`
- GeoJSON publico do atlas novo contem apenas campos publicos

## Remocao de versoes ruins

Se um deployment parcial for publicado, remover pelo ID do deployment:

```powershell
npx.cmd vercel remove <deployment-id> --yes --safe
```

Use `--safe` para pular deployments que ainda tenham alias ativo.

Manter:

- deployment atual correto
- uma versao anterior comprovadamente boa

Remover:

- deployments que causaram `404`
- deployments que omitiram paginas publicas
- deployments que expuseram dado bruto
