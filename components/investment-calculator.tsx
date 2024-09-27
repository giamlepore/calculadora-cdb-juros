"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun, BarChart, Table, Share2, Check, Camera } from "lucide-react"
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import domToImage from 'dom-to-image'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function InvestmentCalculatorComponent() {
  const [investmentType, setInvestmentType] = useState<'compound' | 'cdb'>('compound')
  const [principal, setPrincipal] = useState<string>('')
  const [rate, setRate] = useState<number | ''>('')
  const [time, setTime] = useState<number | ''>('')
  const [contribution, setContribution] = useState<string>('')
  const [cdbRate, setCdbRate] = useState<number | ''>('')
  const [result, setResult] = useState<number | null>(null)
  const [totalInvested, setTotalInvested] = useState<number | null>(null)
  const [interestGained, setInterestGained] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true)
  const [showChart, setShowChart] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any>({})
  const [isChartView, setIsChartView] = useState<boolean>(true)
  const [calculationSummary, setCalculationSummary] = useState<string | null>(null)
  const [filledFields, setFilledFields] = useState<{ [key: string]: boolean }>({})
  const [comparisonData, setComparisonData] = useState<any>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode)
    const params = new URLSearchParams(window.location.search)
    if (params.get('type')) {
      setInvestmentType(params.get('type') as 'compound' | 'cdb')
      setPrincipal(formatCurrency(params.get('principal') || ''))
      setRate(Number(params.get('rate')) || '')
      setTime(Number(params.get('time')) || '')
      setContribution(formatCurrency(params.get('contribution') || ''))
      setCdbRate(Number(params.get('cdbRate')) || '')
      calculateInvestment()
    }
  }, [isDarkMode])

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '')
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parseCurrency = (value: string): number => {
    return Number(value.replace(/\./g, ''))
  }

  const calculateInvestment = () => {
    if (investmentType === 'compound') {
      calculateCompoundInterest()
    } else {
      calculateCDB()
    }
    updateCalculationSummary()
    calculateComparisons()
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const calculateCompoundInterest = (additionalContribution = 0) => {
    const r = Number(rate) / 100 / 12
    const n = Number(time) * 12
    const monthlyContribution = parseCurrency(contribution) + additionalContribution
    const compoundInterest =
      parseCurrency(principal) * Math.pow(1 + r, n) +
      monthlyContribution * ((Math.pow(1 + r, n) - 1) / r)
    const totalInvested = parseCurrency(principal) + (monthlyContribution * n)
    const interestGained = compoundInterest - totalInvested

    if (additionalContribution === 0) {
      setResult(parseFloat(compoundInterest.toFixed(2)))
      setTotalInvested(parseFloat(totalInvested.toFixed(2)))
      setInterestGained(parseFloat(interestGained.toFixed(2)))
    }

    const labels = []
    const data = []
    for (let i = 0; i <= n; i++) {
      const amount =
        parseCurrency(principal) * Math.pow(1 + r, i) +
        monthlyContribution * ((Math.pow(1 + r, i) - 1) / r)
      labels.push(i)
      data.push(parseFloat(amount.toFixed(2)))
    }

    if (additionalContribution === 0) {
      setChartData({
        labels,
        datasets: [
          {
            label: 'Montante',
            data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      })
    }

    return { labels, data }
  }

  const calculateCDB = (additionalContribution = 0) => {
    const cdiRate = Number(rate) / 100
    const cdbYieldRate = (cdiRate * Number(cdbRate)) / 100
    const monthlyRate = Math.pow(1 + cdbYieldRate, 1/12) - 1
    const n = Number(time) * 12
    
    let totalAmount = parseCurrency(principal)
    const labels = [0]
    const data = [parseCurrency(principal)]
    const monthlyContribution = parseCurrency(contribution) + additionalContribution
    
    for (let i = 1; i <= n; i++) {
      totalAmount = totalAmount * (1 + monthlyRate) + monthlyContribution
      labels.push(i)
      data.push(parseFloat(totalAmount.toFixed(2)))
    }

    const totalInvested = parseCurrency(principal) + (monthlyContribution * n)
    const interestGained = totalAmount - totalInvested

    if (additionalContribution === 0) {
      setResult(parseFloat(totalAmount.toFixed(2)))
      setTotalInvested(parseFloat(totalInvested.toFixed(2)))
      setInterestGained(parseFloat(interestGained.toFixed(2)))
      setChartData({
        labels,
        datasets: [
          {
            label: 'Montante',
            data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      })
    }

    return { labels, data }
  }

  const calculateComparisons = () => {
    const baseResult = investmentType === 'compound' ? calculateCompoundInterest() : calculateCDB()
    const result10 = investmentType === 'compound' ? calculateCompoundInterest(parseCurrency(contribution) * 0.1) : calculateCDB(parseCurrency(contribution) * 0.1)
    const result20 = investmentType === 'compound' ? calculateCompoundInterest(parseCurrency(contribution) * 0.2) : calculateCDB(parseCurrency(contribution) * 0.2)
    const result30 = investmentType === 'compound' ? calculateCompoundInterest(parseCurrency(contribution) * 0.3) : calculateCDB(parseCurrency(contribution) * 0.3)

    setComparisonData({
      labels: baseResult.labels,
      datasets: [
        {
          label: 'Contribuição Original',
          data: baseResult.data,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: '+10% Contribuição',
          data: result10.data,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        },
        {
          label: '+20% Contribuição',
          data: result20.data,
          borderColor: 'rgb(255, 205, 86)',
          tension: 0.1
        },
        {
          label: '+30% Contribuição',
          data: result30.data,
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }
      ]
    })
  }

  const updateCalculationSummary = () => {
    let summary = `Tipo de Investimento: ${investmentType === 'compound' ? 'Juros Compostos' : 'CDB'}\n`
    summary += `Capital Inicial: R$ ${principal}\n`
    summary += `Taxa de Juros Anual: ${rate}%\n`
    summary += `Tempo: ${time} anos\n`
    summary += `Contribuição Mensal: R$ ${contribution}\n`
    if (investmentType === 'cdb') {
      summary += `Percentual do CDI: ${cdbRate}%\n`
    }
    setCalculationSummary(summary)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const toggleChartVisibility = () => {
    setShowChart(!showChart)
    if (!showChart && chartRef.current) {
      setTimeout(() => {
        chartRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const toggleChartView = () => {
    setIsChartView(!isChartView)
    if (!isChartView) {
      calculateComparisons()
    }
  }

  const shareCalculation = () => {
    const params = new URLSearchParams({
      type: investmentType,
      principal: principal,
      rate: rate.toString(),
      time: time.toString(),
      contribution: contribution,
      cdbRate: cdbRate.toString()
    })
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado para a área de transferência!')
    })
  }

  const handleInputFocus = (field: string) => {
    setFilledFields(prev => ({ ...prev, [field]: true }))
  }

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'principal':
      case 'contribution':
        const formattedValue = formatCurrency(value)
        field === 'principal' ? setPrincipal(formattedValue) : setContribution(formattedValue)
        break
      case 'rate':
      case 'time':
      case 'cdbRate':
        const numValue = value === '' ? '' : Number(value)
        field === 'rate' ? setRate(numValue) : field === 'time' ? setTime(numValue) : setCdbRate(numValue)
        break
    }
  }

  const allFieldsFilled = () => {
    if (investmentType === 'compound') {
      return principal !== '' && rate !== '' && time !== '' && contribution !== ''
    } else {
      return principal !== '' && rate !== '' && time !== '' && contribution !== '' && cdbRate !== ''
    }
  }

  const saveScreenshot = async () => {
    if (resultRef.current) {
      const shareButton = resultRef.current.querySelector('#shareButton')
      const saveButton = resultRef.current.querySelector('#saveButton')
      if (shareButton) shareButton.style.display = 'none'
      if (saveButton) (saveButton as HTMLElement).style.display = 'none'

      try {
        const dataUrl = await domToImage.toPng(resultRef.current)
        const link = document.createElement('a')
        link.download = 'investment-result.png'
        link.href = dataUrl
        link.click()
      } catch (error) {
        console.error('Error generating screenshot:', error)
        alert('Ocorreu um erro ao gerar a captura de tela. Por favor, tente novamente.')
      } finally {
        if (shareButton) shareButton.style.display = 'flex'
        if (saveButton) (saveButton as HTMLElement).style.display = 'flex'
      }
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-start p-4">
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">A calculadora de juros compostos e CDB mais simples (e bonita) da internet, que resolve o seu problema.</CardTitle>
          
        <p className="text-xxl text-gray-600 dark:text-gray-400 mb-8">
          Essa calculadora é apenas uma estimativa desses investimentos.
        </p>
        </CardHeader>
        </Card>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('https://tally.so/r/31v1ob', '_blank')}
          className="mb-4"
        >
          Como podemos melhorar?
        </Button>
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calculadora de Investimentos</CardTitle>
              <Button variant="outline" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Tabs value={investmentType} onValueChange={(value) => setInvestmentType(value as 'compound' | 'cdb')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compound">Juros Compostos</TabsTrigger>
                <TabsTrigger value="cdb">CDB</TabsTrigger>
              </TabsList>
              <TabsContent value="compound">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Capital Inicial (R$)
                    </Label>
                    <div className="relative">
                      <Input
                        id="principal"
                        type="text"
                        value={principal}
                        onChange={(e) => handleInputChange('principal', e.target.value)}
                        onFocus={() => handleInputFocus('principal')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.principal && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Taxa de Juros Anual (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="rate"
                        type="number"
                        value={rate}
                        onChange={(e) => handleInputChange('rate', e.target.value)}
                        onFocus={() => handleInputFocus('rate')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.rate && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tempo (anos)
                    </Label>
                    <div className="relative">
                      <Input
                        id="time"
                        type="number"
                        value={time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        onFocus={() => handleInputFocus('time')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.time && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contribuição Mensal (R$)
                    </Label>
                    <div className="relative">
                      <Input
                        id="contribution"
                        type="text"
                        value={contribution}
                        onChange={(e) => handleInputChange('contribution', e.target.value)}
                        onFocus={() => handleInputFocus('contribution')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.contribution && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="cdb">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Capital Inicial (R$)
                    </Label>
                    <div className="relative">
                      <Input
                        id="principal"
                        type="text"
                        value={principal}
                        onChange={(e) => handleInputChange('principal', e.target.value)}
                        onFocus={() => handleInputFocus('principal')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.principal && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Taxa CDI Anual (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="rate"
                        type="number"
                        value={rate}
                        onChange={(e) => handleInputChange('rate', e.target.value)}
                        onFocus={() => handleInputFocus('rate')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.rate && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdbRate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Percentual do CDI (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="cdbRate"
                        type="number"
                        value={cdbRate}
                        onChange={(e) => handleInputChange('cdbRate', e.target.value)}
                        onFocus={() => handleInputFocus('cdbRate')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.cdbRate && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tempo (anos)
                    </Label>
                    <div className="relative">
                      <Input
                        id="time"
                        type="number"
                        value={time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        onFocus={() => handleInputFocus('time')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.time && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contribuição Mensal (R$)
                    </Label>
                    <div className="relative">
                      <Input
                        id="contribution"
                        type="text"
                        value={contribution}
                        onChange={(e) => handleInputChange('contribution', e.target.value)}
                        onFocus={() => handleInputFocus('contribution')}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 pr-8"
                      />
                      {filledFields.contribution && <Check className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex space-x-2">
              <Button
                onClick={calculateInvestment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={!allFieldsFilled()}
              >
                Calcular
              </Button>
              <Button
                onClick={toggleChartVisibility}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!allFieldsFilled()}
              >
                {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
              </Button>
            </div>
            {result !== null && (
              <div ref={resultRef} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Montante Final:</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    R$ {result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Investido:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    R$ {totalInvested?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rendimento:</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 animate-pulse">
                    R$ {interestGained?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {calculationSummary && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resumo do Cálculo:</p>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {calculationSummary}
                    </pre>
                  </div>
                )}
                <Button
                  id="shareButton"
                  onClick={shareCalculation}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Compartilhar Cálculo
                </Button>
                <Button
                  id="saveButton"
                  onClick={saveScreenshot}
                  className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
                >
                  <Camera className="mr-2 h-4 w-4" /> Salvar Foto
                </Button>
              </div>
            )}
            {showChart && (
              <div ref={chartRef} className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Evolução do Investimento</h3>
                  <Button variant="outline" size="sm" onClick={toggleChartView}>
                    {isChartView ? <Table className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
                  </Button>
                </div>
                {isChartView ? (
                  <div className="h-64 w-full">
                    <Line data={comparisonData || chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mês</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Montante (R$)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">+10% Contribuição</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">+20% Contribuição</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">+30% Contribuição</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {comparisonData?.labels.map((label: string, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{label}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {comparisonData.datasets[0].data[index].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {comparisonData.datasets[1].data[index].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {comparisonData.datasets[2].data[index].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {comparisonData.datasets[3].data[index].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}