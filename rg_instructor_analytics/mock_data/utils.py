def apply_data_mocker(MockCls):
    def function_wrapper(func):
        def params_wrapper(*args, **kwargs):
            mocker = MockCls(func, *args, **kwargs)
            return mocker.choose_mock_or_origin_data()

        return params_wrapper

    return function_wrapper
