import { Button, Input, Spinner, useInput, useToasts, Radio, Card } from '@geist-ui/core'
import { FC, useCallback, useState, useEffect } from 'react'
import useSWR from 'swr'
import { getProviderConfigs, ProviderConfigs, ProviderType, saveProviderConfigs } from '@/config'
import { Select as Aselect } from 'antd'
const { Option } = Aselect
import { isSafari } from '@/utils/utils'

interface ConfigProps {
  config: ProviderConfigs
  models: string[]
}

const ConfigPanel: FC<ConfigProps> = ({ config, models }) => {
  const [tab, setTab] = useState<ProviderType>(isSafari ? ProviderType.GPT3 : config.provider)
  const { bindings: apiKeyBindings } = useInput(config.configs[ProviderType.GPT3]?.apiKey ?? '')
  const { bindings: apiHostBindings } = useInput(config.configs[ProviderType.GPT3]?.apiHost ?? '')
  const { bindings: apiPathBindings } = useInput(config.configs[ProviderType.GPT3]?.apiPath ?? '')
  const [model, setModel] = useState(config.configs[ProviderType.GPT3]?.model ?? models[0])
  const { setToast } = useToasts()

  const save = useCallback(async () => {
    if (tab === ProviderType.GPT3) {
      if (!apiKeyBindings.value) {
        alert('Please enter your OpenAI API key')
        return
      }

      if (!model || !models.includes(model)) {
        alert('Please select a valid model')
        return
      }
    }

    let apiHost = apiHostBindings.value || ''
    apiHost = apiHost.replace(/^http(s)?:\/\//, '')

    const apiPath = apiPathBindings.value || ''

    await saveProviderConfigs(tab, {
      [ProviderType.GPT3]: {
        model,
        apiKey: apiKeyBindings.value,
        apiHost: apiHost,
        apiPath: apiPath,
      },
    })
    setToast({ text: 'Changes saved', type: 'success' })
  }, [
    apiHostBindings.value,
    apiKeyBindings.value,
    apiPathBindings.value,
    model,
    models,
    setToast,
    tab,
  ])

  useEffect(() => {
    console.log('config', config)
    console.log('models', models)
  }, [config, models])

  return (
    <>
      <Card className="glarity--card">
        <div className="glarity--flex glarity--flex-col glarity--gap-3">
          <Radio.Group value={tab} onChange={(v) => setTab(v as ProviderType)}>
            {!isSafari && (
              <>
                <Radio value={ProviderType.ChatGPT}>
                  ChatGPT webapp
                  <Radio.Desc>
                    {' '}
                    The API that powers ChatGPT webapp, free, but sometimes unstable
                  </Radio.Desc>
                </Radio>
              </>
            )}

            <Radio value={ProviderType.GPT3}>
              OpenAI API
              <Radio.Desc>
                <div className="glarity--flex glarity--flex-col glarity--gap-2">
                  <span>
                    OpenAI official API, more stable,{' '}
                    <span className="glarity--font-semibold">charge by usage</span>
                  </span>
                  <div className="glarity--flex glarity--flex-row glarity--gap-2 glarity--geist--select">
                    <Input
                      htmlType="text"
                      placeholder="api.openai.com"
                      label="API Host"
                      scale={2 / 3}
                      clearable
                      {...apiHostBindings}
                    />
                    <Input
                      htmlType="text"
                      placeholder="/v1/chat/completions"
                      label="API Path"
                      scale={2 / 3}
                      clearable
                      {...apiPathBindings}
                    />
                    <Aselect
                      defaultValue={model}
                      onChange={(v) => setModel(v as string)}
                      placeholder="model"
                      optionLabelProp="label"
                      style={{ width: '170px' }}
                    >
                      {models.map((m) => (
                        <Option key={m} value={m} label={m}>
                          {m}
                        </Option>
                      ))}
                    </Aselect>
                    <Input
                      htmlType="password"
                      placeholder="sk-********"
                      label="API key"
                      scale={2 / 3}
                      clearable
                      {...apiKeyBindings}
                    />
                  </div>
                  <span className="glarity--italic glarity--text-xs">
                    You can find or create your API key{' '}
                    <a
                      href="https://platform.openai.com/account/api-keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      here
                    </a>
                  </span>
                </div>
              </Radio.Desc>
            </Radio>
          </Radio.Group>
          <Card.Footer>
            <Button scale={2 / 3} style={{ width: 20 }} type="success" onClick={save}>
              Save
            </Button>
          </Card.Footer>
        </div>
      </Card>
    </>
  )
}

function ProviderSelect() {
  const query = useSWR('provider-configs', async () => {
    const [config] = await Promise.all([getProviderConfigs()])

    return { config }
  })

  const models = [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0301',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-16k',
    'text-davinci-003',
    // 'text-curie-001',
    // 'text-babbage-001',
    // 'text-ada-001',
    // 'text-chat-davinci-002-20221122',
  ]

  if (query.isLoading) {
    return <Spinner />
  }
  
  if (query.error) {
    return <div>Error loading provider configurations.</div>
  }

  if (!query.data || !query.data.config) {
    return <div>No provider configurations found.</div>
  }

  return <ConfigPanel config={query.data!.config} models={models} />
}

export default ProviderSelect
