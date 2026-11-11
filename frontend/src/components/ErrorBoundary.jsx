import React, { Component } from 'react'
import ErrorPage from '../views/ErrorPage'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('MindForm Uncaught Exception caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code={500}
          error={this.state.error}
          onRetry={this.handleReset}
          onHome={() => { window.location.href = '/' }}
        />
      )
    }

    return this.props.children
  }
}
