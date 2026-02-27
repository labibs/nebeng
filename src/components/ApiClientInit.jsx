// src/components/ApiClientInit.jsx
// Initializes the API client with Clerk's getToken function
// Must be rendered inside ClerkProvider

import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { initApiClient } from '../lib/apiClient'

export default function ApiClientInit() {
    const { getToken } = useAuth()

    useEffect(() => {
        initApiClient(getToken)
    }, [getToken])

    return null
}
