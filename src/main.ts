/**
 * Copyright (C) 2025 GIP-RECIA, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { JWT } from '@uportal/open-id-connect'

import type { Alignment, AllowedButtons, Config, Driver, DriveStep, Side, State } from 'driver.js'
import { driver } from 'driver.js'
import { querySelectorDeep } from 'query-selector-shadow-dom'
import { getToken } from './services/soffitUtils'
import 'driver.js/dist/driver.css'
import './style/css/global.css'
import 'regenerator-runtime'

window.addEventListener('keyup', handleOutsideEvents)
window.addEventListener('click', handleOutsideEvents)
addEventListener('DOMContentLoaded', init)

let currentDrive: Driver | undefined
let config: Config | undefined
let steps: Array<StepFromJson> | undefined
let isProcessingClic: boolean = false
let getUserTourUri: string
let setUserTourUri: string

const breakpoints: Map<BreakpointsKeys, number> = new Map([
  ['xs', 0],
  ['sm', 576],
  ['md', 768],
  ['lg', 992],
  ['xl', 1200],
  ['xxl', 1400],
])

type BreakpointsKeys = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

function getIcon(icon: string): string {
  return `<i id="r-driver-icon" class="${icon}"></i>`
}

function getTitle(title: string, icon?: string): string {
  return `<div class="space">${icon ? getIcon(icon) : ''} <button id="r-close" src="https://placehold.co/20"><svg class="fontawesome" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg></button></div><h2>${title}</h2>`
}

function getRenderLambda() {
  return () => {
    if (config?.allowClose) {
      window.document.getElementById('r-close')?.addEventListener('click', () => {
        currentDrive?.destroy()
      })
    }
    else {
      window.document.getElementById('r-close')?.setAttribute('hidden', 'true')
    }
  }
}

function handleOutsideEvents(ev: Event) {
  if (currentDrive?.isActive()) {
    ev.stopImmediatePropagation()
  }
}

interface StepFromJson {
  title: string
  description: string
  element: string
  icon?: string
  showButtons?: AllowedButtons[]
  side?: Side
  sideMobile?: Side
  align?: Alignment
  alignMobile?: Alignment
  clickOnNextCssSelector?: string
  clickOnPrevCssSelector?: string
}

interface UserTour {
  tutorial: Array<string>
}
const completeKey: string = 'COMPLETED'

async function getUserTourComplete() {
  const url = getUserTourUri
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const json: UserTour = await response.json()
    return json
  }
  catch (error: any) {
    console.error(error.message)
  }
}

async function setUserTourComplete() {
  const url = setUserTourUri
  const map = new Map<string, boolean>()
  map.set(completeKey, true)
  const userTour: UserTour = { tutorial: [completeKey] }
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(userTour),
    })
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
  }
  catch (error: any) {
    console.error(error.message)
  }
}

function getProperty(property: string): string | undefined {
  return document.querySelector('script#didacticiel-ent')?.getAttribute(property) ?? undefined
}

async function init(_ev: Event): Promise<void> {
  let confUri: string | undefined = getProperty('confUri')
  if (confUri === undefined) {
    console.error('No configuration URI for tutorial')
    return
  }

  getUserTourUri = getProperty('getUserTourUri') ?? ''
  setUserTourUri = getProperty('setUserTourUri') ?? ''

  confUri = import.meta.env.VITE_BASE_URI + confUri
  const configurationValue:
    | { tourConfig: Config, stepsConfig: StepFromJson[] }
    | undefined = await getConfJson(confUri)

  if (configurationValue === undefined) {
    console.error('No configuration for tutorial')
    return
  }

  config = configurationValue.tourConfig
  steps = configurationValue.stepsConfig

  // create  event to relaunch tutorial only here, because there is no point to register if conf is missing
  window.addEventListener('eyebrow-user-info', startTutorial)

  // WIP: for now the tutorial open each time
  const userTutorialData: UserTour | undefined = await getUserTourComplete()
  if (userTutorialData?.tutorial.includes(completeKey)) {
    // return
  }

  // for test only, to no display tutorial to everyone when they open the portal page

  const token: { encoded: string, decoded: JWT } = await getToken(
    import.meta.env.VITE_USER_TOKEN_URI,
  )
  const allowedUsers: Array<string>
    = import.meta.env.VITE_ALLOWED_TEST_USERS.split(';')

  if (allowedUsers.includes(token.decoded.sub)) {
    startTutorial()
  }
}

function startTutorial() {
  if (currentDrive?.isActive()) {
    return
  }

  if (config === undefined || steps === undefined || steps.length === 0) {
    console.error('Incorrect configuration for tutorial')
    return
  }
  config.steps = steps.map(x => createStep(x))
  config.smoothScroll = true
  config.disableActiveInteraction = true
  config.allowKeyboardControl = false
  const driverObjTour = driver(config)
  currentDrive = driverObjTour
  driverObjTour.drive()
}

function createStep(stepFromJson: StepFromJson): DriveStep {
  const isMobile = window.innerWidth < breakpoints.get('lg')! // if < lg
  let elementToClickOnNext: HTMLElement | undefined
  if (stepFromJson.clickOnNextCssSelector !== undefined) {
    try {
      elementToClickOnNext = querySelectorDeep(
        `${stepFromJson.clickOnNextCssSelector}`,
      ) as HTMLElement
    }
    catch {
      elementToClickOnNext = undefined
    }
  }

  let elementToClickOnPrev: HTMLElement | undefined

  if (stepFromJson.clickOnPrevCssSelector !== undefined) {
    try {
      elementToClickOnPrev = querySelectorDeep(
        `${stepFromJson.clickOnPrevCssSelector}`,
      ) as HTMLElement
    }
    catch {
      elementToClickOnPrev = undefined
    }
  }
  return {
    // element: stepFromJson.element,
    element: querySelectorDeep(stepFromJson.element) ?? undefined,

    popover: {
      showButtons: stepFromJson.showButtons,
      title: getTitle(stepFromJson.title, stepFromJson.icon),
      description: stepFromJson.description,
      side: isMobile ? stepFromJson.sideMobile : stepFromJson.side,
      align: isMobile ? stepFromJson.alignMobile : stepFromJson.align,
      onNextClick: (
        element?: Element,
        step: DriveStep,
        options: { config: Config, state: State, driver: Driver },
      ) => {
        isProcessingClic = true

        if (elementToClickOnNext) {
          elementToClickOnNext.click()
        }
        if (!options.driver.hasNextStep()) {
          setUserTourComplete()
        }
        currentDrive?.moveNext()
        isProcessingClic = false
      },
      onPrevClick: (
        element?: Element,
        step: DriveStep,
        options: { config: Config, state: State, driver: Driver },
      ) => {
        if (isProcessingClic) {
          return
        }
        if (!options.driver.hasPreviousStep) {
          return
        }
        isProcessingClic = true
        if (elementToClickOnPrev) {
          elementToClickOnPrev.click()
        }
        currentDrive?.movePrevious()
        isProcessingClic = false
      },
      onPopoverRender: getRenderLambda(),
    },
  }
}

async function getConfJson(
  url: string,
): Promise<{ tourConfig: Config, stepsConfig: StepFromJson[] } | undefined> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const json = await response.json()

    const values: { tourConfig: Config, stepsConfig: StepFromJson[] } = json
    return values
  }
  catch (error: any) {
    console.error(error.message)
  }
}
